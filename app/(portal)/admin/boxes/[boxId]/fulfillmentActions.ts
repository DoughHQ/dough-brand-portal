'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import {
  fetchBoxFulfillments,
  isOperatorFulfillmentAction,
  type FulfillmentRow,
  type OperatorFulfillmentAction,
} from '@/lib/box/fulfillment'

async function assertOperator(): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = await getPortalBrandScope()
  if (!scope || scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    return { ok: false, error: 'Not authorized.' }
  }
  return { ok: true }
}

export async function listBoxFulfillmentsAction(
  boxId: string
): Promise<{ ok: true; rows: FulfillmentRow[] } | { ok: false; error: string }> {
  const gate = await assertOperator()
  if (!gate.ok) return gate
  const supabase = await createServerSupabaseClient()
  return fetchBoxFulfillments(supabase, boxId)
}

export async function advanceFulfillmentAction(args: {
  boxId: string
  fulfillmentId: string
  target: OperatorFulfillmentAction
  reason?: string
  trackingRef?: string
  carrier?: string
}): Promise<
  | { ok: true; rows: FulfillmentRow[]; message: string }
  | { ok: false; error: string }
> {
  const gate = await assertOperator()
  if (!gate.ok) return gate
  if (!isOperatorFulfillmentAction(args.target)) {
    return { ok: false, error: 'Not authorized.' }
  }

  const supabase = await createServerSupabaseClient()
  const reason = args.reason?.trim()
  const tracking = args.trackingRef?.trim()
  const carrier = args.carrier?.trim()

  const { error } = await supabase.rpc('advance_box_fulfillment', {
    p_fulfillment_id: args.fulfillmentId,
    p_target: args.target,
    ...(reason ? { p_reason: reason } : {}),
    ...(tracking ? { p_tracking_ref: tracking } : {}),
    ...(carrier ? { p_carrier: carrier } : {}),
  })
  if (error) {
    return { ok: false, error: humanizeFulfillmentError(error.message) }
  }

  const refreshed = await fetchBoxFulfillments(supabase, args.boxId)
  if (!refreshed.ok) return { ok: false, error: refreshed.error }

  return { ok: true, rows: refreshed.rows, message: messageFor(args.target) }
}

function messageFor(target: OperatorFulfillmentAction): string {
  switch (target) {
    case 'confirmed':
      return 'Claim confirmed.'
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

function humanizeFulfillmentError(raw: string): string {
  if (raw.includes('not authorized')) return 'Not authorized.'
  if (raw.includes('is terminal')) return 'This seat is already in a final state.'
  if (raw.includes('illegal transition')) {
    return 'That action isn’t available from this seat’s current state.'
  }
  if (raw.includes('not found')) return 'That seat was not found.'
  return raw
}
