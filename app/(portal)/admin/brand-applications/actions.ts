'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import {
  BrandApplicationsError,
  listBrandWaitlistApplications,
  setBrandApplicationStatus,
  type BrandApplication,
  type SetBrandApplicationStatusResult,
} from '@/lib/brandApplications'

async function requireDoughAdmin() {
  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') {
    throw new BrandApplicationsError(
      'not_authorized',
      'You don’t have permission to review brand applications.'
    )
  }
  return portalUser
}

export async function listBrandWaitlistApplicationsAction(): Promise<{
  ok: boolean
  rows?: BrandApplication[]
  error?: string
  code?: string
}> {
  try {
    await requireDoughAdmin()
    const supabase = await createServerSupabaseClient()
    const rows = await listBrandWaitlistApplications(supabase)
    return { ok: true, rows }
  } catch (err) {
    if (err instanceof BrandApplicationsError) {
      return { ok: false, error: err.message, code: err.code }
    }
    return { ok: false, error: 'Couldn’t load the applications queue.', code: 'load_failed' }
  }
}

export async function setBrandApplicationStatusAction(input: {
  waitlistId: string
  decision: 'approve' | 'reject'
  reviewNotes?: string | null
}): Promise<{
  ok: boolean
  result?: SetBrandApplicationStatusResult
  error?: string
  code?: string
}> {
  try {
    await requireDoughAdmin()
    const supabase = await createServerSupabaseClient()
    const result = await setBrandApplicationStatus(supabase, input)
    return { ok: true, result }
  } catch (err) {
    if (err instanceof BrandApplicationsError) {
      return { ok: false, error: err.message, code: err.code }
    }
    return { ok: false, error: 'Couldn’t complete the review. Try again.', code: 'review_failed' }
  }
}
