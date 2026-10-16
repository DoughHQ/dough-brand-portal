import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Json } from '@/lib/database.types'
import {
  blankCorrectionRow,
  canApproveAsIs,
  isBlankLeaf,
  isCaptureProductImage,
  type TaxonomySearchHit,
} from '@/lib/corrections.shared'
import { searchTaxonomyNodes as searchTaxonomyNodesShared } from '@/lib/taxonomy'

async function publishCorrectionImage(
  submissionId: string
): Promise<{ ok: boolean; error?: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return { ok: false, error: 'Supabase env not configured' }
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { ok: false, error: 'Not authenticated' }

  const res = await fetch(`${base}/functions/v1/publish_correction_image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ submission_id: submissionId }),
  })
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    message?: string
  }
  if (!res.ok || body.ok === false) {
    return { ok: false, error: body.message ?? body.error ?? `HTTP ${res.status}` }
  }
  return { ok: true }
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

  if (decision === 'approved' || decision === 'overridden') {
    const { data: sub, error: loadErr } = await supabase
      .from('product_correction_submissions')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle()

    if (loadErr || !sub) return { ok: false, error: loadErr?.message ?? 'Submission not found' }
    const row = sub as Record<string, unknown>
    if (row.status !== 'pending_human_review') {
      return { ok: false, error: 'Submission is not pending review' }
    }
    const capturePath = typeof row.evidence_capture_path === 'string' ? row.evidence_capture_path : ''
    const capturePhoto = isCaptureProductImage({
      correction_type: row.correction_type == null ? null : String(row.correction_type),
      evidence_capture_path: capturePath,
    })
    if (capturePhoto && decision === 'overridden') {
      return { ok: false, error: 'A photo correction cannot be overridden. Apply the photo or reject it.' }
    }
    if (capturePhoto && decision === 'approved') {
      return publishCorrectionImage(submissionId)
    }

    if (decision === 'approved') {
      const probe = blankCorrectionRow({
        id: String(row.id),
        correction_type: row.correction_type == null ? null : String(row.correction_type),
        proposed_value: (row.proposed_value ?? {}) as Record<string, unknown>,
        evidence_image_url: row.evidence_image_url == null ? null : String(row.evidence_image_url),
        evidence_capture_path: capturePath || null,
        proposed_taxonomy_node_id: row.proposed_taxonomy_node_id == null ? null : Number(row.proposed_taxonomy_node_id),
        proposed_price_amount: row.proposed_price_amount as number | string | null,
        status: row.status == null ? null : String(row.status),
      })

      if (!canApproveAsIs(probe)) {
        return {
          ok: false,
          error:
            'Cannot apply an empty value. Extract from the photo or enter values, then apply — or reject.',
        }
      }
    }
  }

  if (decision === 'overridden' && (!opts?.correctedValue || isBlankLeaf(opts.correctedValue))) {
    return { ok: false, error: 'Enter a value before applying.' }
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
  return searchTaxonomyNodesShared(query, 25)
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
