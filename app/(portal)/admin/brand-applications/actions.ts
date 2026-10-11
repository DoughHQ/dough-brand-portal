'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { parseImpersonatedBrandIdFromAccessToken } from '@/lib/portal/parseImpersonationClaim'
import {
  BrandApplicationsError,
  asCatalogCandidates,
  describeDecisionResult,
  listBrandWaitlistApplicationsPage,
  type BrandApplication,
  type BrandApplicationsPageCursor,
  type CatalogCandidate,
  type DecisionResultTone,
} from '@/lib/brandApplications'

async function requireDoughAdminNotImpersonating() {
  const scope = await getPortalBrandScope()
  if (!scope || scope.portalUser.role !== 'dough_admin') {
    throw new BrandApplicationsError(
      'not_authorized',
      'You don’t have permission to review brand applications.'
    )
  }
  if (scope.isImpersonating) {
    throw new BrandApplicationsError(
      'impersonating',
      'Leave the brand workspace (stop impersonating) before reviewing applications.'
    )
  }
  return scope
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
    await requireDoughAdminNotImpersonating()
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

export type DecideBrandApplicationInput = {
  action: 'approve' | 'resend' | 'revoke' | 'reject'
  waitlistId: string
  brandName?: string | null
  existingBrandId?: number | null
  confirmNew?: boolean
  reviewNotes?: string | null
  sendEmail?: boolean
}

export type DecideBrandApplicationResult = {
  ok: boolean
  error?: string
  code?: string
  tone?: DecisionResultTone
  closeAndRefresh?: boolean
  invitation_id?: string
  brand_id?: number
  brand_name?: string
  brand_created?: boolean
  invited_email?: string
  sent?: boolean | null
  send_error?: string
  revoked?: number
  candidates?: CatalogCandidate[]
  status?: number
}

function refusalResult(
  code: string,
  extras?: {
    invitedEmail?: string | null
    candidates?: CatalogCandidate[]
    httpStatus?: number
  }
): DecideBrandApplicationResult {
  const described = describeDecisionResult(code, {
    invitedEmail: extras?.invitedEmail,
    hasCandidates: (extras?.candidates?.length ?? 0) > 0,
    httpStatus: extras?.httpStatus,
  })
  return {
    ok: false,
    code,
    error: described.message,
    tone: described.tone,
    closeAndRefresh: described.closeAndRefresh,
    candidates: extras?.candidates,
    invited_email: extras?.invitedEmail ?? undefined,
    status: extras?.httpStatus,
  }
}

/**
 * Calls brand_application_decision with the session JWT (never service role).
 * Pattern mirrors extractCorrectionLabel in lib/corrections.ts.
 */
export async function decideBrandApplicationAction(
  input: DecideBrandApplicationInput
): Promise<DecideBrandApplicationResult> {
  try {
    await requireDoughAdminNotImpersonating()

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!base) {
      return {
        ok: false,
        error: 'Supabase env not configured',
        code: 'not_configured',
        tone: 'error',
        closeAndRefresh: false,
      }
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return refusalResult('401', { httpStatus: 401 })
    }

    // Database refuses any non-null claim; match that even when claim == admin brand_id.
    if (parseImpersonatedBrandIdFromAccessToken(session.access_token) != null) {
      return refusalResult('impersonating')
    }

    const body: Record<string, unknown> = {
      action: input.action,
      waitlist_id: input.waitlistId,
    }
    if (input.brandName != null) body.brand_name = input.brandName
    if (input.existingBrandId != null) body.existing_brand_id = input.existingBrandId
    if (input.confirmNew != null) body.confirm_new = input.confirmNew
    if (input.reviewNotes != null) body.review_notes = input.reviewNotes
    if (input.sendEmail != null) body.send_email = input.sendEmail

    const res = await fetch(`${base}/functions/v1/brand_application_decision`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    let parsed: Record<string, unknown> = {}
    try {
      const j = await res.json()
      if (j && typeof j === 'object') parsed = j as Record<string, unknown>
    } catch {
      parsed = {}
    }

    const candidates = asCatalogCandidates(parsed.candidates)
    const invitedEmail =
      parsed.invited_email != null ? String(parsed.invited_email) : null

    if (res.status === 401) {
      return refusalResult('401', { httpStatus: 401 })
    }

    if (res.status === 409 || parsed.error === 'invites_disabled') {
      return refusalResult('invites_disabled', { httpStatus: res.status })
    }

    if (res.status === 403 || parsed.error === 'not_authorized') {
      return refusalResult('not_authorized', { httpStatus: res.status })
    }

    if (parsed.ok === false) {
      const code = String(parsed.error ?? 'unknown')
      return refusalResult(code, {
        invitedEmail,
        candidates: candidates.length > 0 ? candidates : undefined,
        httpStatus: res.status,
      })
    }

    if (!res.ok) {
      // Gateway/timeout 5xx with no edge body is ambiguous — may have saved already.
      const code = String(parsed.error ?? 'unknown')
      return refusalResult(code, { httpStatus: res.status })
    }

    return {
      ok: parsed.ok === true,
      invitation_id:
        parsed.invitation_id != null ? String(parsed.invitation_id) : undefined,
      brand_id:
        typeof parsed.brand_id === 'number'
          ? parsed.brand_id
          : parsed.brand_id != null
            ? Number(parsed.brand_id)
            : undefined,
      brand_name: parsed.brand_name != null ? String(parsed.brand_name) : undefined,
      brand_created: typeof parsed.brand_created === 'boolean' ? parsed.brand_created : undefined,
      invited_email: invitedEmail ?? undefined,
      sent: typeof parsed.sent === 'boolean' ? parsed.sent : parsed.sent === null ? null : undefined,
      send_error: parsed.send_error != null ? String(parsed.send_error) : undefined,
      revoked: typeof parsed.revoked === 'number' ? parsed.revoked : undefined,
      candidates: candidates.length > 0 ? candidates : undefined,
      status: res.status,
    }
  } catch (err) {
    if (err instanceof BrandApplicationsError) {
      const described = describeDecisionResult(err.code)
      return {
        ok: false,
        error: err.message || described.message,
        code: err.code,
        tone: described.tone,
        closeAndRefresh: described.closeAndRefresh,
      }
    }
    const described = describeDecisionResult('unknown')
    return {
      ok: false,
      error: described.message,
      code: 'unknown',
      tone: described.tone,
      closeAndRefresh: described.closeAndRefresh,
    }
  }
}
