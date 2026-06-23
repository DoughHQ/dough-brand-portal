import { createServerSupabaseClient } from '@/lib/supabase-server'

export type CorrectionReviewRow = {
  id: string
  product_id: number
  created_at: string
  correction_type: string | null
  product_name_display: string | null
  brand_name: string | null
  current_category: string | null
  current_value: Record<string, unknown> | null
  proposed_value: Record<string, unknown> | null
  user_notes: string | null
  evidence_image_url: string | null
  proposed_taxonomy_node_id: number | null
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

export async function getPendingCorrectionReviews(): Promise<CorrectionReviewRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('correction_review_queue')
    .select(QUEUE_SELECT)
    .eq('status', 'pending_human_review')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getPendingCorrectionReviews error:', error.message)
    return []
  }
  return (data ?? []) as CorrectionReviewRow[]
}

export async function reviewCorrectionSubmission(
  submissionId: string,
  action: 'approve' | 'reject'
): Promise<{ ok: boolean; error?: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return { ok: false, error: 'Supabase env not configured' }

  const supabase = await createServerSupabaseClient()
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
    }),
  })

  const body = (await res.json()) as { error?: string; status?: string }
  if (!res.ok || body.error) {
    return { ok: false, error: body.error ?? `HTTP ${res.status}` }
  }
  return { ok: true }
}
