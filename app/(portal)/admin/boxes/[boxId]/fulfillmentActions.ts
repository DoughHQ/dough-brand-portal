'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import {
  fetchBoxAddressChanges,
  fetchBoxFulfillments,
  fetchBoxShipHolds,
  fulfillmentActionMessage,
  humanizeFulfillmentError,
  isOperatorFulfillmentAction,
  type AddressChanges,
  type FulfillmentRow,
  type OperatorFulfillmentAction,
  type ShipHolds,
} from '@/lib/box/fulfillment'

async function assertOperator(): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = await getPortalBrandScope()
  if (!scope || scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    return { ok: false, error: 'Not authorized.' }
  }
  return { ok: true }
}

type SeatList = {
  rows: FulfillmentRow[]
  holds: ShipHolds
  addressChanges: AddressChanges
}

async function fetchSeats(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  boxId: string
): Promise<({ ok: true } & SeatList) | { ok: false; error: string }> {
  const [list, holds, addressChanges] = await Promise.all([
    fetchBoxFulfillments(supabase, boxId),
    fetchBoxShipHolds(supabase, boxId),
    fetchBoxAddressChanges(supabase, boxId),
  ])
  if (!list.ok) return list
  return { ok: true, rows: list.rows, holds, addressChanges }
}

export async function listBoxFulfillmentsAction(
  boxId: string
): Promise<({ ok: true } & SeatList) | { ok: false; error: string }> {
  const gate = await assertOperator()
  if (!gate.ok) return gate
  const supabase = await createServerSupabaseClient()
  return fetchSeats(supabase, boxId)
}

export async function advanceFulfillmentAction(args: {
  boxId: string
  fulfillmentId: string
  target: OperatorFulfillmentAction
  reason?: string
  trackingRef?: string
  carrier?: string
}): Promise<
  | ({ ok: true; message: string } & SeatList)
  | ({ ok: false; error: string } & Partial<SeatList>)
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
    const message = humanizeFulfillmentError(error.message, error.hint)
    // A refused ship may be a hold the list did not show yet: re-read it.
    const seats = await fetchSeats(supabase, args.boxId)
    return seats.ok
      ? {
          ok: false,
          error: message,
          rows: seats.rows,
          holds: seats.holds,
          addressChanges: seats.addressChanges,
        }
      : { ok: false, error: message }
  }

  const refreshed = await fetchSeats(supabase, args.boxId)
  if (!refreshed.ok) return { ok: false, error: refreshed.error }

  return {
    ok: true,
    rows: refreshed.rows,
    holds: refreshed.holds,
    addressChanges: refreshed.addressChanges,
    message: fulfillmentActionMessage(args.target),
  }
}
