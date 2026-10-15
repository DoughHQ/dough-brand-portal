'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import {
  fetchBrandSeats,
  fulfillmentActionMessage,
  humanizeFulfillmentError,
  isBrandFulfillmentAction,
  type BrandFulfillmentAction,
  type BrandSeatList,
} from '@/lib/box/brandFulfillment'

async function assertBrandScope(): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = await getPortalBrandScope()
  if (!scope) return { ok: false, error: 'Not authorized.' }
  return { ok: true }
}

export async function listBrandBoxFulfillmentsAction(
  boxId: string
): Promise<({ ok: true } & BrandSeatList) | { ok: false; error: string }> {
  const gate = await assertBrandScope()
  if (!gate.ok) return gate
  const supabase = await createServerSupabaseClient()
  return fetchBrandSeats(supabase, boxId)
}

export async function advanceBrandFulfillmentAction(args: {
  boxId: string
  fulfillmentId: string
  target: BrandFulfillmentAction
  reason?: string
  trackingRef?: string
  carrier?: string
}): Promise<
  | ({ ok: true; message: string } & BrandSeatList)
  | ({ ok: false; error: string } & Partial<BrandSeatList>)
> {
  const gate = await assertBrandScope()
  if (!gate.ok) return gate
  if (!isBrandFulfillmentAction(args.target)) {
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
    const seats = await fetchBrandSeats(supabase, args.boxId)
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

  const refreshed = await fetchBrandSeats(supabase, args.boxId)
  if (!refreshed.ok) return { ok: false, error: refreshed.error }

  return {
    ok: true,
    rows: refreshed.rows,
    holds: refreshed.holds,
    addressChanges: refreshed.addressChanges,
    message: fulfillmentActionMessage(args.target),
  }
}
