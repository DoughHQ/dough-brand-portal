import { SUPPORT_EMAIL } from '@/lib/productMaster/support'
import type { BrandInviteState } from '@/lib/brandInvite.server'

export type InviteCopy = {
  title: string
  body: string
  /** Small print under the primary action. */
  smallPrint?: string
  action: 'continue' | 'password' | 'login' | 'none'
  actionLabel?: string
}

export const WRONG_PASSWORD_COPY =
  "That password didn't work. Use Forgot password on the sign-in page, then come back to this link."

export const GENERIC_INVITE_ERROR_COPY =
  'Something went wrong on our side. Try again in a minute; if it keeps happening, write to hello@itsarunoff.com.'

/**
 * Only call this for peek states; `brandName` / `email` are required for
 * valid, resume and has_account.
 */
export function describeInviteState(
  state: BrandInviteState,
  ctx: { brandName?: string | null; email?: string | null }
): InviteCopy {
  const brand = ctx.brandName?.trim() || 'this brand'
  const email = ctx.email?.trim() || 'your email'

  switch (state) {
    case 'valid':
      return {
        title: `Join ${brand} on Runoff`,
        body: `You'll join as ${email}.`,
        smallPrint: "Opening this page doesn't use your invite.",
        action: 'continue',
        actionLabel: 'Continue',
      }
    case 'resume':
      return {
        title: `Finish setting up ${brand}`,
        body: `You'll join as ${email}.`,
        smallPrint: "Opening this page doesn't use your invite.",
        action: 'continue',
        actionLabel: 'Continue',
      }
    case 'has_account':
      return {
        title: `Join ${brand} on Runoff`,
        body: `${email} already has an account. Sign in to connect it to ${brand}.`,
        action: 'password',
        actionLabel: 'Sign in and join',
      }
    case 'expired':
      return {
        title: 'This invite has expired',
        body: `Reply to your invite email, or write to ${SUPPORT_EMAIL}, and we'll send a new one.`,
        action: 'none',
      }
    case 'used':
      return {
        title: 'This invite has already been used',
        body: 'Sign in with your email and password. If you never set one, use Forgot password on the sign-in page.',
        action: 'login',
        actionLabel: 'Sign in',
      }
    case 'revoked':
    case 'invalid':
      return {
        title: "This invite link isn't valid",
        body: `If you were expecting one, write to ${SUPPORT_EMAIL}.`,
        action: 'none',
      }
    case 'other_brand':
      return {
        title: "This email already belongs to another brand's workspace on Runoff",
        body: `Write to ${SUPPORT_EMAIL} and we'll sort it out.`,
        action: 'none',
      }
    case 'blocked':
    case 'brand_has_admin':
    case 'unavailable':
      return {
        title: "We can't open this workspace from this link",
        body: `Write to ${SUPPORT_EMAIL} and we'll sort it out.`,
        action: 'none',
      }
    case 'error':
    default:
      return {
        title: 'Something went wrong on our side',
        body: `Try again in a minute; if it keeps happening, write to ${SUPPORT_EMAIL}.`,
        action: 'none',
      }
  }
}
