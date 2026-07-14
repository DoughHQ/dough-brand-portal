import { createServerSupabaseClient } from '@/lib/supabase-server'

export type CorrectionReviewRow = {
  id: string
  product_id: number
  created_at: string
  correction_type: string | null
  product_name_display: string | null
  brand_name: string | null
  current_category: string | null
  current_category_path: string | null
  current_value: Record<string, unknown> | null
  proposed_value: Record<string, unknown> | null
  user_notes: string | null
  evidence_image_url: string | null
  product_image_url: string | null
  proposed_taxonomy_node_id: number | null
  proposed_category_label: string | null
  proposed_category_path: string | null
  other_category_description: string | null
  proposed_price_amount: number | string | null
  proposed_price_store: string | null
  proposed_price_unit: string | null
  claude_decision: string | null
  claude_confidence: number | string | null
  claude_reasoning: string | null
  claude_corrected_value: Record<string, unknown> | null
  status: string | null
}

const QUEUE_SELECT =
  'id, product_id, created_at, correction_type, product_name_display, brand_name, current_category, current_value, proposed_value, user_notes, evidence_image_url, proposed_taxonomy_node_id, other_category_description, proposed_price_amount, proposed_price_store, proposed_price_unit, claude_decision, claude_confidence, claude_reasoning, claude_corrected_value, status'

/** Types where the user supplies a photo and structured proposed_value is empty/`{}`. */
export const PHOTO_ONLY_TYPES = new Set(['nutrition_facts', 'ingredients'])

function isBlankLeaf(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (typeof v === 'number') return !Number.isFinite(v)
  if (typeof v === 'boolean') return false
  if (Array.isArray(v)) return v.length === 0 || v.every(isBlankLeaf)
  if (typeof v === 'object') {
    const vals = Object.values(v as Record<string, unknown>)
    return vals.length === 0 || vals.every(isBlankLeaf)
  }
  return false
}

/** True when approving as-is would apply nothing meaningful (§6.1 / empty-value guard). */
export function isEmptyApplicableProposal(row: CorrectionReviewRow): boolean {
  const ct = (row.correction_type ?? '').toLowerCase()
  if (PHOTO_ONLY_TYPES.has(ct)) return true

  if (ct === 'category') {
    if (row.proposed_taxonomy_node_id != null) return false
    const pv = row.proposed_value
    const nodeId = pv?.taxonomy_node_id
    return nodeId == null || nodeId === ''
  }

  if (ct === 'product_image') {
    const url =
      (row.proposed_value?.image_url as string | undefined) ??
      row.evidence_image_url
    return !url || String(url).trim() === ''
  }

  if (ct === 'price') {
    return row.proposed_price_amount == null && isBlankLeaf(row.proposed_value)
  }

  return isBlankLeaf(row.proposed_value)
}

export function canApproveAsIs(row: CorrectionReviewRow): boolean {
  return !isEmptyApplicableProposal(row)
}

export async function getPendingCorrectionReviews(): Promise<CorrectionReviewRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('correction_review_queue')
    .select(QUEUE_SELECT)
    .eq('status', 'pending_human_review')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[corrections] querying project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.error('[corrections] getPendingCorrectionReviews error:', {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    })
    throw error
  }

  const baseRows = (data ?? []) as CorrectionReviewRow[]

  if (process.env.NODE_ENV !== 'production') {
    console.log('[corrections] rows returned:', baseRows.length)
  }

  if (baseRows.length === 0) return []

  const productIds = [...new Set(baseRows.map((r) => r.product_id))]
  const nodeIds = new Set<number>()
  for (const r of baseRows) {
    if (r.proposed_taxonomy_node_id != null) nodeIds.add(Number(r.proposed_taxonomy_node_id))
    const pvNode = r.proposed_value?.taxonomy_node_id
    if (typeof pvNode === 'number') nodeIds.add(pvNode)
    if (typeof pvNode === 'string' && pvNode.trim() !== '' && Number.isFinite(Number(pvNode))) {
      nodeIds.add(Number(pvNode))
    }
  }

  const [{ data: products }, { data: nodes }] = await Promise.all([
    supabase.from('products').select('product_id, image_url, taxonomy_node_id').in('product_id', productIds),
    nodeIds.size > 0
      ? supabase
          .from('taxonomy_nodes')
          .select('taxonomy_node_id, node_name_display, path_names_csv')
          .in('taxonomy_node_id', [...nodeIds])
      : Promise.resolve({ data: [] as Array<{
          taxonomy_node_id: number
          node_name_display: string | null
          path_names_csv: string | null
        }> }),
  ])

  // Current category paths: resolve via product taxonomy when view only has display name
  const currentNodeIds = [
    ...new Set(
      (products ?? [])
        .map((p) => p.taxonomy_node_id as number | null)
        .filter((id): id is number => id != null)
    ),
  ]
  const needCurrent = currentNodeIds.filter((id) => !nodeIds.has(id))
  const { data: currentNodes } =
    needCurrent.length > 0
      ? await supabase
          .from('taxonomy_nodes')
          .select('taxonomy_node_id, node_name_display, path_names_csv')
          .in('taxonomy_node_id', needCurrent)
      : { data: [] as Array<{
          taxonomy_node_id: number
          node_name_display: string | null
          path_names_csv: string | null
        }> }

  const productById = new Map(
    (products ?? []).map((p) => [p.product_id as number, p])
  )
  const nodeById = new Map<
    number,
    { node_name_display: string | null; path_names_csv: string | null }
  >()
  for (const n of [...(nodes ?? []), ...(currentNodes ?? [])]) {
    nodeById.set(n.taxonomy_node_id as number, {
      node_name_display: n.node_name_display as string | null,
      path_names_csv: n.path_names_csv as string | null,
    })
  }

  return baseRows.map((row) => {
    const product = productById.get(row.product_id)
    let proposedNodeId = row.proposed_taxonomy_node_id != null
      ? Number(row.proposed_taxonomy_node_id)
      : null
    if (proposedNodeId == null) {
      const raw = row.proposed_value?.taxonomy_node_id
      if (typeof raw === 'number') proposedNodeId = raw
      else if (typeof raw === 'string' && Number.isFinite(Number(raw))) proposedNodeId = Number(raw)
    }
    const proposedNode = proposedNodeId != null ? nodeById.get(proposedNodeId) : null
    const currentNodeId = product?.taxonomy_node_id as number | null | undefined
    const currentNode = currentNodeId != null ? nodeById.get(currentNodeId) : null

    return {
      ...row,
      product_image_url: (product?.image_url as string | null) ?? null,
      proposed_category_label: proposedNode?.node_name_display ?? null,
      proposed_category_path: proposedNode?.path_names_csv ?? null,
      current_category_path: currentNode?.path_names_csv ?? null,
      current_category:
        row.current_category ?? currentNode?.node_name_display ?? null,
    }
  })
}

export async function reviewCorrectionSubmission(
  submissionId: string,
  action: 'approve' | 'reject',
  humanNotes?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return { ok: false, error: 'Supabase env not configured' }

  const supabase = await createServerSupabaseClient()

  if (action === 'approve') {
    const { data: sub, error: loadErr } = await supabase
      .from('product_correction_submissions')
      .select('id, correction_type, proposed_value, proposed_taxonomy_node_id, proposed_price_amount, evidence_image_url, status')
      .eq('id', submissionId)
      .maybeSingle()

    if (loadErr || !sub) return { ok: false, error: loadErr?.message ?? 'Submission not found' }
    if (sub.status !== 'pending_human_review') {
      return { ok: false, error: 'Submission is not pending review' }
    }

    const probe: CorrectionReviewRow = {
      id: sub.id as string,
      product_id: 0,
      created_at: '',
      correction_type: sub.correction_type as string | null,
      product_name_display: null,
      brand_name: null,
      current_category: null,
      current_category_path: null,
      current_value: null,
      proposed_value: (sub.proposed_value ?? {}) as Record<string, unknown>,
      user_notes: null,
      evidence_image_url: sub.evidence_image_url as string | null,
      product_image_url: null,
      proposed_taxonomy_node_id: sub.proposed_taxonomy_node_id as number | null,
      proposed_category_label: null,
      proposed_category_path: null,
      other_category_description: null,
      proposed_price_amount: sub.proposed_price_amount as number | string | null,
      proposed_price_store: null,
      proposed_price_unit: null,
      claude_decision: null,
      claude_confidence: null,
      claude_reasoning: null,
      claude_corrected_value: null,
      status: sub.status as string | null,
    }

    if (!canApproveAsIs(probe)) {
      return {
        ok: false,
        error:
          'Cannot apply an empty value. Extract from the photo or enter values, then override — or reject.',
      }
    }
  }

  if (action === 'reject' && (!humanNotes || humanNotes.trim() === '')) {
    return { ok: false, error: 'A reject reason is required.' }
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { ok: false, error: 'Not authenticated' }

  const res = await fetch(`${base}/functions/v1/review_product_correction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      submission_id: submissionId,
      human_notes: humanNotes?.trim() || null,
    }),
  })

  const body = (await res.json()) as { error?: string; status?: string }
  if (!res.ok || body.error) {
    return { ok: false, error: body.error ?? `HTTP ${res.status}` }
  }
  return { ok: true }
}
