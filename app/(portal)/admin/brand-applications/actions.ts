'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import {
  BrandApplicationsError,
  listBrandWaitlistApplicationsPage,
  setBrandApplicationStatus,
  type BrandApplication,
  type BrandApplicationsPageCursor,
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

export async function listBrandWaitlistApplicationsAction(opts?: {
  cursor?: BrandApplicationsPageCursor | null
}): Promise<{
  ok: boolean
  rows?: BrandApplication[]
  hasMore?: boolean
  nextCursor?: BrandApplicationsPageCursor | null
  error?: string
  code?: string
}> {
  try {
    await requireDoughAdmin()
    const supabase = await createServerSupabaseClient()
    const page = await listBrandWaitlistApplicationsPage(supabase, {
      limit: 25,
      cursor: opts?.cursor ?? null,
    })
    return {
      ok: true,
      rows: page.rows,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    }
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
