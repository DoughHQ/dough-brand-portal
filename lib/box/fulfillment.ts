/**
 * Operator logistics wrappers for box fulfillments.
 * Console-only. The operator's job is getting boxes to people; session
 * progress and abandonment belong to the respondent and the sweeps, which
 * have time-based guards (abandon_deadline, claim expires_at) the RPC enforces.
 *
 * Phase 0: confirming is respondent-only. Ship / re-ship need a recorded
 * agreement to final terms and an address on the seat.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type FulfillmentState = Database['public']['Enums']['box_fulfillment_state']

export type FulfillmentRow =
  Database['public']['Functions']['list_operator_box_fulfillments']['Returns'][number]

/** Logistics targets an operator may drive. Anything not here is respondent-
 *  or sweep-driven and must NOT be a button. Confirm is never operator-driven. */
export const OPERATOR_FULFILLMENT_ACTIONS = [
  'shipped',
  'delivered',
  'delivery_failed',
  'fulfillment_pending',
] as const

export type OperatorFulfillmentAction = (typeof OPERATOR_FULFILLMENT_ACTIONS)[number]

export function isOperatorFulfillmentAction(
  value: string
): value is OperatorFulfillmentAction {
  return (OPERATOR_FULFILLMENT_ACTIONS as readonly string[]).includes(value)
}

type Client = SupabaseClient<Database>

export async function fetchBoxFulfillments(
  supabase: Client,
  boxId: string
): Promise<{ ok: true; rows: FulfillmentRow[] } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('list_operator_box_fulfillments', {
    p_box_id: boxId,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

export type FulfillmentReadiness = {
  consentedAt: string | null
  /** Address on file from the list join (city is enough). */
  hasAddress: boolean
}

export function fulfillmentHasAddress(row: {
  ship_city: string | null
  recipient_name: string | null
}): boolean {
  return Boolean(
    (row.ship_city && row.ship_city.trim()) ||
      (row.recipient_name && row.recipient_name.trim())
  )
}

export function fulfillmentReadyToShip(readiness: FulfillmentReadiness): boolean {
  return Boolean(readiness.consentedAt) && readiness.hasAddress
}

/** The operator-driven logistics actions legal from a given state. Empty array
 *  means nothing for the operator to do (respondent/sweep territory). */
export function operatorActionsFor(
  state: FulfillmentState,
  readiness: FulfillmentReadiness
): OperatorFulfillmentAction[] {
  const ready = fulfillmentReadyToShip(readiness)
  switch (state) {
    case 'claimed':
      return []
    case 'confirmed':
      return ready ? ['shipped', 'delivery_failed'] : ['delivery_failed']
    case 'fulfillment_pending':
      return ready ? ['shipped', 'delivery_failed'] : ['delivery_failed']
    case 'shipped':
      return ['delivered', 'delivery_failed']
    case 'delivery_failed':
      return ready ? ['fulfillment_pending'] : []
    // delivered, sessions, completed, flagged, abandoned, claim_expired:
    // no operator actions — respondent or sweep owns these.
    default:
      return []
  }
}

export function fulfillmentActionLabel(action: OperatorFulfillmentAction): string {
  switch (action) {
    case 'shipped':
      return 'Mark shipped'
    case 'delivered':
      return 'Mark delivered'
    case 'delivery_failed':
      return 'Delivery failed'
    case 'fulfillment_pending':
      return 'Retry delivery'
  }
}

export function fulfillmentStateLabel(state: FulfillmentState): string {
  switch (state) {
    case 'claimed':
      return 'Claimed'
    case 'confirmed':
      return 'Confirmed'
    case 'fulfillment_pending':
      return 'Ready to ship'
    case 'shipped':
      return 'Shipped'
    case 'delivered':
      return 'Delivered'
    case 'session_1_active':
      return 'Session 1'
    case 'session_1_complete':
      return 'Session 1 done'
    case 'session_2_active':
      return 'Session 2'
    case 'completed':
      return 'Completed'
    case 'flagged':
      return 'Flagged'
    case 'abandoned':
      return 'Abandoned'
    case 'claim_expired':
      return 'Claim expired'
    case 'delivery_failed':
      return 'Delivery failed'
  }
}

function leftReasonLabel(reason: string | null): string {
  switch (reason) {
    case 'allergy':
      return 'allergy or ingredient'
    case 'not_for_me':
      return 'not for them'
    case 'other':
      return 'something else'
    default:
      return 'no reason given'
  }
}

/** Quiet status line under the seat name. Prefer leave / consent over bare state. */
export function fulfillmentSeatStatus(row: {
  state: FulfillmentState
  left_at: string | null
  left_reason: string | null
  consented_at: string | null
  consent_version: string | null
  tracking_ref: string | null
  carrier: string | null
  dings_reliability: boolean
}): string {
  const bits: string[] = []

  if (row.left_at) {
    bits.push(`Left · ${leftReasonLabel(row.left_reason)}`)
  } else if (row.state === 'claim_expired') {
    bits.push('Claim expired · sweep')
  } else if (row.state === 'claimed' && !row.consented_at) {
    bits.push('Waiting for respondent to confirm')
  } else if (row.consented_at) {
    bits.push(
      row.consent_version
        ? `Agreed · ${row.consent_version}`
        : 'Agreed'
    )
    if (row.state !== 'claimed') {
      bits.push(fulfillmentStateLabel(row.state))
    }
  } else {
    bits.push(fulfillmentStateLabel(row.state))
  }

  if (row.tracking_ref) {
    bits.push(`${row.carrier || 'tracking'} ${row.tracking_ref}`)
  }
  if (row.dings_reliability) {
    bits.push('reliability ding')
  }

  return bits.join(' · ')
}

/** Copy when ship actions are withheld because the respondent has not confirmed. */
export function fulfillmentWaitingCopy(
  state: FulfillmentState,
  readiness: FulfillmentReadiness
): string | null {
  if (fulfillmentReadyToShip(readiness)) return null
  if (state === 'claimed') return 'Waiting for the respondent to confirm'
  if (state === 'confirmed' || state === 'fulfillment_pending') {
    return 'Waiting for the respondent to confirm'
  }
  if (state === 'delivery_failed') {
    return 'Cannot retry until the respondent has confirmed'
  }
  return null
}

export function fulfillmentActionMessage(target: OperatorFulfillmentAction): string {
  switch (target) {
    case 'shipped':
      return 'Marked shipped.'
    case 'delivered':
      return 'Marked delivered.'
    case 'delivery_failed':
      return 'Marked delivery failed.'
    case 'fulfillment_pending':
      return 'Back in the shipping queue.'
  }
}

/**
 * Operator-facing errors. Phase 0 codes arrive in PostgREST HINT, not the message.
 */
export function humanizeFulfillmentError(
  message: string,
  hint?: string | null
): string {
  const code = (hint ?? '').trim()
  if (code === 'RESPONDENT_MUST_CONFIRM') {
    return 'Only the respondent can confirm — they agree to the terms and give an address in the app.'
  }
  if (code === 'NO_FINAL_CONSENT') {
    return 'This seat has no address or no recorded agreement to final box terms, so it cannot ship.'
  }
  if (message.includes('not authorized')) return 'Not authorized.'
  if (message.includes('is terminal')) return 'This seat is already in a final state.'
  if (message.includes('illegal transition')) {
    return 'That action isn’t available from this seat’s current state.'
  }
  if (message.includes('not found')) return 'That seat was not found.'
  return message
}
