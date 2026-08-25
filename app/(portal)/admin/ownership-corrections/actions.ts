'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import {
  OwnershipReviewError,
  listPendingOwnershipCorrections,
  reviewBrandOwnershipCorrection,
  type PendingOwnershipCorrection,
  type ReviewOwnershipResult,
} from '@/lib/ownershipCorrections'

async function requireDoughAdmin() {
  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') {
    throw new OwnershipReviewError('not_authorized', 'You don’t have permission to review ownership corrections.')
  }
  return portalUser
}

export async function listPendingOwnershipCorrectionsAction(): Promise<{
  ok: boolean
  rows?: PendingOwnershipCorrection[]
  error?: string
  code?: string
}> {
  try {
    await requireDoughAdmin()
    const supabase = await createServerSupabaseClient()
    const rows = await listPendingOwnershipCorrections(supabase)
    return { ok: true, rows }
  } catch (err) {
    if (err instanceof OwnershipReviewError) {
      return { ok: false, error: err.message, code: err.code }
    }
    return { ok: false, error: 'Couldn’t load the ownership queue.', code: 'review_failed' }
  }
}

export async function reviewOwnershipCorrectionAction(input: {
  correctionId: string
  decision: 'accept' | 'reject'
  reviewNotes?: string | null
  overrideStale?: boolean
}): Promise<{
  ok: boolean
  result?: ReviewOwnershipResult
  error?: string
  code?: string
}> {
  try {
    await requireDoughAdmin()
    const supabase = await createServerSupabaseClient()
    const result = await reviewBrandOwnershipCorrection(supabase, input)
    return { ok: true, result }
  } catch (err) {
    if (err instanceof OwnershipReviewError) {
      return { ok: false, error: err.message, code: err.code }
    }
    return { ok: false, error: 'Couldn’t complete the review. Try again.', code: 'review_failed' }
  }
}
