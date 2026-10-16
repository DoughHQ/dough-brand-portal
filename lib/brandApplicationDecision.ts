import { friendlyBrandApplicationsError } from './brandApplicationModel'

export type DecisionResultTone = 'error' | 'warn' | 'info'

export type DecisionResultDescription = {
  message: string
  tone: DecisionResultTone
  closeAndRefresh: boolean
}

export type DescribeDecisionExtras = {
  invitedEmail?: string | null
  hasCandidates?: boolean
  httpStatus?: number
}

const ALREADY_DECIDED = new Set([
  'not_pending',
  'not_invited',
  'not_rejectable',
  'already_accepted',
])

/**
 * Maps brand_application_decision refusal codes to queue copy and behaviour.
 * send_error on a successful approve/resend/reject is not an error code — handle separately.
 */
export function describeDecisionResult(
  code: string,
  extras?: DescribeDecisionExtras
): DecisionResultDescription {
  const raw = String(code ?? '').trim()
  const normalized = raw.toLowerCase()
  const httpStatus = extras?.httpStatus

  if (httpStatus === 401 || normalized === '401') {
    return {
      message: 'Your session expired. Sign in again.',
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (
    normalized === 'impersonating' ||
    normalized === 'impersonation' ||
    normalized.includes('impersonat')
  ) {
    return {
      message: friendlyBrandApplicationsError('impersonating'),
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (
    normalized === 'not_authorized' ||
    normalized.includes('not authorized') ||
    normalized.includes('42501') ||
    httpStatus === 403
  ) {
    return {
      message: friendlyBrandApplicationsError('not_authorized'),
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'invites_disabled') {
    return {
      message: friendlyBrandApplicationsError('invites_disabled'),
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'not_found' || normalized === 'application_not_found') {
    return {
      message: 'This application is no longer in the queue.',
      tone: 'info',
      closeAndRefresh: true,
    }
  }

  if (ALREADY_DECIDED.has(normalized)) {
    return {
      message:
        'This application was already decided. The list is refreshed to show where it stands.',
      tone: 'info',
      closeAndRefresh: true,
    }
  }

  if (normalized === 'already_invited') {
    return {
      message: 'An invite for this email and brand is already pending. Nothing was changed.',
      tone: 'info',
      closeAndRefresh: true,
    }
  }

  if (normalized === 'possible_duplicate') {
    if (extras?.hasCandidates) {
      return {
        message:
          'This may already be in the catalog. Pick the brand to link, or choose Create new brand.',
        tone: 'warn',
        closeAndRefresh: false,
      }
    }
    return {
      message:
        'This name may already exist in the catalog. Refresh and try again. Nothing was changed.',
      tone: 'warn',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'brand_not_active') {
    return {
      message:
        'That brand isn’t active in the catalog. Pick another or create a new one. Nothing was changed.',
      tone: 'warn',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'brand_already_has_admin') {
    return {
      message: 'That brand already has an admin. Nothing was changed.',
      tone: 'warn',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'brand_has_pending_invite') {
    const email = extras?.invitedEmail?.trim()
    return {
      message: email
        ? `${email} already has a pending invite to this brand. Revoke it or let it expire first. Nothing was changed.`
        : 'Someone already has a pending invite to this brand. Revoke it or let it expire first. Nothing was changed.',
      tone: 'warn',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'invalid_brand_name') {
    return {
      message: 'Brand name must be 1–200 characters.',
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (
    normalized === 'invalid_body' ||
    normalized === 'invalid_token_hash' ||
    normalized === 'invalid_action' ||
    normalized === 'invalid_waitlist_id' ||
    normalized.startsWith('invalid_')
  ) {
    return {
      message: 'Couldn’t prepare that request. Nothing was changed.',
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'rpc_failed' || normalized === 'misconfigured') {
    return {
      message: 'The decision wasn’t saved. Nothing was changed. Try again.',
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  return {
    message: 'Couldn’t confirm whether it went through. Refresh to see where it stands.',
    tone: 'error',
    closeAndRefresh: false,
  }
}
