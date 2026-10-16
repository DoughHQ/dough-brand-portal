import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  blankCorrectionRow,
  evidenceToSign,
  type CorrectionReviewRow,
  type CorrectionReviewsPage,
  type CorrectionReviewsPageCursor,
} from '@/lib/corrections.shared'
export type {
  CorrectionReviewRow,
  CorrectionReviewsPage,
  CorrectionReviewsPageCursor,
  TaxonomySearchHit,
} from '@/lib/corrections.shared'
export {
  PHOTO_ONLY_TYPES,
  canApproveAsIs,
  isEmptyApplicableProposal,
  isBlankLeaf,
  isCaptureProductImage,
} from '@/lib/corrections.shared'

const PAGE_DEFAULT_LIMIT = 25

async function hydrateCorrectionRows(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  baseRows: CorrectionReviewRow[]
): Promise<CorrectionReviewRow[]> {
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
    supabase
      .from('products')
      .select('product_id, image_url, taxonomy_node_id, product_name_short, brand_id')
      .in('product_id', productIds),
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

  const hydrated = baseRows.map((row) => {
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
      product_name_short:
        (product?.product_name_short as string | null | undefined)?.trim()
          ? String(product?.product_name_short)
          : row.product_name_short,
      brand_id:
        product?.brand_id == null ? row.brand_id : Number(product.brand_id),
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
  return attachEvidencePreviews(supabase, hydrated)
}

const EVIDENCE_SIGN_TTL_SEC = 60 * 60 * 4

/** Sign private correction photos. https URLs pass through. The stored ref is left unchanged. */
async function attachEvidencePreviews(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  rows: CorrectionReviewRow[]
): Promise<CorrectionReviewRow[]> {
  const captures: { id: string; path: string }[] = []
  const preview = new Map<string, string | null>()
  for (const row of rows) {
    const src = evidenceToSign(row)
    if (!src) preview.set(row.id, null)
    else if (src.kind === 'http') preview.set(row.id, src.url)
    else captures.push({ id: row.id, path: src.path })
  }
  if (captures.length > 0) {
    const signed = await signCapturePaths(supabase, captures)
    for (const [id, url] of signed) preview.set(id, url)
  }
  return rows.map((row) => ({ ...row, evidence_preview_url: preview.get(row.id) ?? null }))
}

/** The reviewer's session signs a capture a submission they can see names. */
async function signCapturePaths(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  items: { id: string; path: string }[]
): Promise<Map<string, string | null>> {
  const preview = new Map<string, string | null>()
  try {
    const { data, error } = await supabase.storage
      .from('captures')
      .createSignedUrls(items.map((item) => item.path), EVIDENCE_SIGN_TTL_SEC)
    if (error || !data) {
      console.warn('[corrections] session sign failed', error?.message ?? 'empty')
      for (const item of items) preview.set(item.id, null)
      return preview
    }
    data.forEach((entry, index) => {
      const item = items[index]
      if (!item) return
      if (entry?.signedUrl && !entry.error) preview.set(item.id, entry.signedUrl)
      else {
        console.warn('[corrections] session sign failed', entry?.error ?? 'empty')
        preview.set(item.id, null)
      }
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'empty'
    console.warn('[corrections] session sign failed', message)
    for (const item of items) preview.set(item.id, null)
  }
  return preview
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

function mapQueueItem(raw: unknown): CorrectionReviewRow | null {
  const r = asRecord(raw)
  if (!r || r.id == null) return null
  return blankCorrectionRow({
    id: String(r.id),
    product_id: Number(r.product_id) || 0,
    created_at: String(r.created_at ?? ''),
    correction_type: r.correction_type == null ? null : String(r.correction_type),
    product_name_display: r.product_name_display == null ? null : String(r.product_name_display),
    brand_name: r.brand_name == null ? null : String(r.brand_name),
    current_category: r.current_category == null ? null : String(r.current_category),
    current_value: (asRecord(r.current_value) as Record<string, unknown> | null) ?? null,
    proposed_value: (asRecord(r.proposed_value) as Record<string, unknown> | null) ?? null,
    extracted_value: (asRecord(r.extracted_value) as Record<string, unknown> | null) ?? null,
    extracted_at: r.extracted_at == null ? null : String(r.extracted_at),
    extraction_error: r.extraction_error == null ? null : String(r.extraction_error),
    human_corrected_value: (asRecord(r.human_corrected_value) as Record<string, unknown> | null) ?? null,
    user_notes: r.user_notes == null ? null : String(r.user_notes),
    evidence_image_url: r.evidence_image_url == null ? null : String(r.evidence_image_url),
    evidence_capture_path: r.evidence_capture_path == null ? null : String(r.evidence_capture_path),
    proposed_taxonomy_node_id:
      r.proposed_taxonomy_node_id == null ? null : Number(r.proposed_taxonomy_node_id),
    other_category_description:
      r.other_category_description == null ? null : String(r.other_category_description),
    proposed_price_amount:
      r.proposed_price_amount == null ? null : (r.proposed_price_amount as number | string),
    proposed_price_store: r.proposed_price_store == null ? null : String(r.proposed_price_store),
    proposed_price_unit: r.proposed_price_unit == null ? null : String(r.proposed_price_unit),
    claude_decision: r.claude_decision == null ? null : String(r.claude_decision),
    claude_confidence:
      r.claude_confidence == null ? null : (r.claude_confidence as number | string),
    claude_reasoning: r.claude_reasoning == null ? null : String(r.claude_reasoning),
    claude_corrected_value: (asRecord(r.claude_corrected_value) as Record<string, unknown> | null) ?? null,
    status: r.status == null ? null : String(r.status),
  })
}

/** Keyset page — hydrate only the returned rows (≤50). */
export async function getPendingCorrectionReviewsPage(opts?: {
  limit?: number
  cursor?: CorrectionReviewsPageCursor | null
  focusId?: string | null
  productId?: number | null
}): Promise<CorrectionReviewsPage> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_pending_correction_reviews' as never, {
    p_limit: opts?.limit ?? PAGE_DEFAULT_LIMIT,
    p_cursor_created_at: opts?.cursor?.createdAt ?? null,
    p_cursor_id: opts?.cursor?.id ?? null,
    p_focus_id: opts?.focusId ?? null,
    p_product_id: opts?.productId ?? null,
  } as never)

  if (error) {
    console.error('[corrections] list_pending_correction_reviews', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    throw error
  }

  const root = asRecord(data) ?? {}
  const itemsRaw = Array.isArray(root.items) ? root.items : []
  const baseRows = itemsRaw
    .map(mapQueueItem)
    .filter((r): r is CorrectionReviewRow => r != null && r.product_id > 0)

  const rows = await hydrateCorrectionRows(supabase, baseRows)
  const cursorRaw = asRecord(root.next_cursor)
  const nextCursor =
    root.has_more === true && cursorRaw?.id != null && cursorRaw.created_at != null
      ? { createdAt: String(cursorRaw.created_at), id: String(cursorRaw.id) }
      : null

  return {
    rows,
    hasMore: root.has_more === true && nextCursor != null,
    nextCursor,
  }
}

/** Brand catalog inbox — session brand only. Never calls review_correction. */
export async function getBrandPendingCorrectionsPage(opts?: {
  limit?: number
  cursor?: CorrectionReviewsPageCursor | null
  focusId?: string | null
  productId?: number | null
}): Promise<CorrectionReviewsPage> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_brand_pending_corrections' as never, {
    p_limit: opts?.limit ?? PAGE_DEFAULT_LIMIT,
    p_cursor_created_at: opts?.cursor?.createdAt ?? null,
    p_cursor_id: opts?.cursor?.id ?? null,
    p_focus_id: opts?.focusId ?? null,
    p_product_id: opts?.productId ?? null,
  } as never)

  if (error) {
    console.error('[corrections] list_brand_pending_corrections', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    throw error
  }

  const root = asRecord(data) ?? {}
  const itemsRaw = Array.isArray(root.items) ? root.items : []
  const baseRows = itemsRaw
    .map(mapQueueItem)
    .filter((r): r is CorrectionReviewRow => r != null && r.product_id > 0)

  const rows = await hydrateCorrectionRows(supabase, baseRows)
  const cursorRaw = asRecord(root.next_cursor)
  const nextCursor =
    root.has_more === true && cursorRaw?.id != null && cursorRaw.created_at != null
      ? { createdAt: String(cursorRaw.created_at), id: String(cursorRaw.id) }
      : null
  const pendingCountRaw = root.pending_count
  const pendingCount =
    typeof pendingCountRaw === 'number'
      ? pendingCountRaw
      : Number(pendingCountRaw)

  return {
    rows,
    hasMore: root.has_more === true && nextCursor != null,
    nextCursor,
    pendingCount: Number.isFinite(pendingCount) ? pendingCount : rows.length,
  }
}


export {
  extractCorrectionLabel,
  reviewCorrectionSubmission,
  searchBrands,
  searchTaxonomyNodes,
} from './correctionsReview'
