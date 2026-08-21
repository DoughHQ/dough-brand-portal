/**
 * Operator logistics wrappers for box fulfillments.
 * Console-only. The operator's job is getting boxes to people; session
 * progress and abandonment belong to the respondent and the sweeps, which
 * have time-based guards (abandon_deadline, claim expires_at) the RPC enforces.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type FulfillmentState = Database['public']['Enums']['box_fulfillment_state']

export type FulfillmentRow =
  Database['public']['Functions']['list_operator_box_fulfillments']['Returns'][number]

/** Logistics targets an operator may drive. Anything not here is respondent-
 *  or sweep-driven and must NOT be a button. */
export const OPERATOR_FULFILLMENT_ACTIONS = [
  'confirmed',
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

/** The operator-driven logistics actions legal from a given state. Empty array
 *  means nothing for the operator to do (respondent/sweep territory). */
export function operatorActionsFor(state: FulfillmentState): OperatorFulfillmentAction[] {
  switch (state) {
    case 'claimed':
      return ['confirmed']
    case 'confirmed':
      return ['shipped', 'delivery_failed']
    case 'fulfillment_pending':
      return ['shipped', 'delivery_failed']
    case 'shipped':
      return ['delivered', 'delivery_failed']
    case 'delivery_failed':
      return ['fulfillment_pending']
    // delivered, sessions, completed, flagged, abandoned, claim_expired:
    // no operator actions — respondent or sweep owns these.
    default:
      return []
  }
}

export function fulfillmentActionLabel(action: OperatorFulfillmentAction): string {
  switch (action) {
    case 'confirmed':
      return 'Confirm claim'
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
