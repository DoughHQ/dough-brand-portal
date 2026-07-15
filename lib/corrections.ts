import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Json } from '@/lib/database.types'
import {
  canApproveAsIs,
  isBlankLeaf,
  type CorrectionReviewRow,
  type TaxonomySearchHit,
} from '@/lib/corrections.shared'

export type { CorrectionReviewRow, TaxonomySearchHit } from '@/lib/corrections.shared'
export {
  PHOTO_ONLY_TYPES,
  canApproveAsIs,
  isEmptyApplicableProposal,
  isBlankLeaf,
} from '@/lib/corrections.shared'

const QUEUE_SELECT =
  'id, product_id, created_at, correction_type, product_name_display, brand_name, current_category, current_value, proposed_value, extracted_value, extracted_at, extraction_error, human_corrected_value, user_notes, evidence_image_url, proposed_taxonomy_node_id, other_category_description, proposed_price_amount, proposed_price_store, proposed_price_unit, claude_decision, claude_confidence, claude_reasoning, claude_corrected_value, status'

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

  const [{ data: products }, { data: nodes }, { data: variants }] = await Promise.all([
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
    supabase
      .from('sku_variants')
      .select('sku_variant_id, product_id, variant_name_display, package_size_value, package_size_uom')
      .in('product_id', productIds)
      .order('sku_variant_id', { ascending: true }),
  ])

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

  const variantsByProduct = new Map<number, CorrectionReviewRow['variants']>()
  for (const v of variants ?? []) {
    const pid = v.product_id as number
    const list = variantsByProduct.get(pid) ?? []
    const size =
      v.package_size_value != null
        ? `${v.package_size_value}${v.package_size_uom ? ` ${v.package_size_uom}` : ''}`
        : null
    list.push({
      sku_variant_id: v.sku_variant_id as number,
      label: [v.variant_name_display, size].filter(Boolean).join(' · ') || `Variant ${v.sku_variant_id}`,
    })
    variantsByProduct.set(pid, list)
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
    const variantList = variantsByProduct.get(row.product_id) ?? []

    return {
      ...row,
      product_image_url: (product?.image_url as string | null) ?? null,
      proposed_category_label: proposedNode?.node_name_display ?? null,
      proposed_category_path: proposedNode?.path_names_csv ?? null,
      current_category_path: currentNode?.path_names_csv ?? null,
      current_category:
        row.current_category ?? currentNode?.node_name_display ?? null,
      variant_count: variantList.length,
      variants: variantList,
    }
  })
}

export async function reviewCorrectionSubmission(
  submissionId: string,
  decision: 'approved' | 'rejected' | 'overridden',
  opts?: {
    correctedValue?: Record<string, unknown> | null
    skuVariantId?: number | null
    notes?: string | null
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  if (decision === 'rejected' && (!opts?.notes || opts.notes.trim() === '')) {
    return { ok: false, error: 'A reject reason is required.' }
  }

  if (decision === 'approved') {
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
      extracted_value: null,
      extracted_at: null,
      extraction_error: null,
      human_corrected_value: null,
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
      variant_count: 0,
      variants: [],
    }

    if (!canApproveAsIs(probe)) {
      return {
        ok: false,
        error:
          'Cannot apply an empty value. Extract from the photo or enter values, then override — or reject.',
      }
    }
  }

  if (decision === 'overridden' && (!opts?.correctedValue || isBlankLeaf(opts.correctedValue))) {
    return { ok: false, error: 'Override requires a non-empty corrected value.' }
  }

  const { data, error } = await supabase.rpc('review_correction', {
    p_submission_id: submissionId,
    p_decision: decision,
    p_corrected_value:
      decision === 'overridden'
        ? ((opts?.correctedValue ?? {}) as Json)
        : undefined,
    p_sku_variant_id: opts?.skuVariantId ?? undefined,
    p_notes: opts?.notes?.trim() || undefined,
  })

  if (error) {
    return { ok: false, error: error.message }
  }
  const body = data as { ok?: boolean; error?: string } | null
  if (body && body.ok === false) {
    return { ok: false, error: body.error ?? 'Review failed' }
  }
  return { ok: true }
}

export async function extractCorrectionLabel(
  submissionId: string
): Promise<{ ok: boolean; extracted_value?: Record<string, unknown>; error?: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return { ok: false, error: 'Supabase env not configured' }

  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { ok: false, error: 'Not authenticated' }

  const res = await fetch(`${base}/functions/v1/extract_correction_label`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ submission_id: submissionId }),
  })

  const body = (await res.json()) as {
    ok?: boolean
    error?: string
    extraction_error?: string
    extracted_value?: Record<string, unknown>
  }
  if (!res.ok || body.error) {
    return { ok: false, error: body.error ?? `HTTP ${res.status}` }
  }
  if (body.ok === false) {
    return { ok: false, error: body.extraction_error ?? 'Extraction failed' }
  }
  return { ok: true, extracted_value: body.extracted_value }
}

export async function searchTaxonomyNodes(query: string): Promise<TaxonomySearchHit[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('search_taxonomy_nodes', {
    p_query: query,
    p_limit: 25,
  })
  if (error) {
    console.error('[corrections] search_taxonomy_nodes', error)
    return []
  }
  return (data ?? []) as TaxonomySearchHit[]
}

export async function searchBrands(query: string): Promise<Array<{ brand_id: number; brand_name: string }>> {
  const supabase = await createServerSupabaseClient()
  const q = query.trim()
  if (q.length < 1) return []
  const { data, error } = await supabase
    .from('brands')
    .select('brand_id, brand_name')
    .ilike('brand_name', `%${q}%`)
    .eq('status', 'active')
    .order('brand_name')
    .limit(25)
  if (error) {
    console.error('[corrections] searchBrands', error)
    return []
  }
  return (data ?? []) as Array<{ brand_id: number; brand_name: string }>
}
