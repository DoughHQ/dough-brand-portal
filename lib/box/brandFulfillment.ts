/**
 * Brand packing wrappers for box fulfillments.
 * Owning brand (or admin) lists full shipping-label fields and drives the same
 * logistics targets as ops: fulfillment_pending / shipped / delivery_failed / delivered.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import {
  OPERATOR_FULFILLMENT_ACTIONS,
  fetchBoxAddressChanges,
  fetchBoxShipHolds,
  parseShipHolds,
  type AddressChange,
  type AddressChanges,
  type NullableExcept,
  type OperatorFulfillmentAction,
  type ShipHolds,
} from '@/lib/box/fulfillment'

export type BrandFulfillmentRow = NullableExcept<
  Database['public']['Functions']['list_brand_box_fulfillments']['Returns'][number],
  'dings_reliability' | 'fulfillment_id' | 'state'
>

/** Same logistics targets brands may drive (backend ACL matches). */
export const BRAND_FULFILLMENT_ACTIONS = OPERATOR_FULFILLMENT_ACTIONS

export type BrandFulfillmentAction = OperatorFulfillmentAction

export {
  isOperatorFulfillmentAction as isBrandFulfillmentAction,
  operatorActionsFor as brandActionsFor,
  fulfillmentActionLabel,
  fulfillmentActionMessage,
  fulfillmentHasAddress,
  fulfillmentSeatStatus,
  fulfillmentWaitingCopy,
  fulfillmentStateLabel,
  humanizeFulfillmentError,
  shipHoldCopy,
  fetchBoxAddressChanges,
  fetchBoxShipHolds,
  parseShipHolds,
  parseAddressChanges,
} from '@/lib/box/fulfillment'

export type { AddressChange, AddressChanges, ShipHolds, OperatorFulfillmentAction }

type Client = SupabaseClient<Database>

export async function fetchBrandBoxFulfillments(
  supabase: Client,
  boxId: string
): Promise<{ ok: true; rows: BrandFulfillmentRow[] } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('list_brand_box_fulfillments', {
    p_box_id: boxId,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

/**
 * Prefer the holds RPC; fall back to inline ship_hold on brand list rows
 * (same codes) when the advisory read is empty.
 */
export function mergeBrandShipHolds(
  holds: ShipHolds,
  rows: BrandFulfillmentRow[]
): ShipHolds {
  if (Object.keys(holds).length > 0) return holds
  return parseShipHolds(
    rows.map((row) => ({
      fulfillment_id: row.fulfillment_id,
      ship_hold: row.ship_hold,
    }))
  )
}

/** Single-line / multi-line block for a packing label. */
export function formatLabelAddress(row: {
  recipient_name: string | null
  ship_line1: string | null
  ship_line2: string | null
  ship_city: string | null
  ship_state: string | null
  ship_postal: string | null
  ship_country: string | null
  ship_phone: string | null
}): string {
  const lines: string[] = []
  const name = row.recipient_name?.trim()
  if (name) lines.push(name)
  const line1 = row.ship_line1?.trim()
  if (line1) lines.push(line1)
  const line2 = row.ship_line2?.trim()
  if (line2) lines.push(line2)

  const city = row.ship_city?.trim()
  const state = row.ship_state?.trim()
  const postal = row.ship_postal?.trim()
  const region = [state, postal].filter(Boolean).join(' ')
  const locality = [city, region].filter(Boolean).join(', ')
  if (locality) lines.push(locality)

  const country = row.ship_country?.trim()
  if (country && country.toUpperCase() !== 'US' && country.toUpperCase() !== 'USA') {
    lines.push(country)
  }
  const phone = row.ship_phone?.trim()
  if (phone) lines.push(phone)
  return lines.join('\n')
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

const CSV_HEADERS = [
  'recipient_name',
  'ship_line1',
  'ship_line2',
  'ship_city',
  'ship_state',
  'ship_postal',
  'ship_country',
  'ship_phone',
  'fulfillment_id',
  'state',
] as const

/** CSV of packing-label rows (full address + seat id/state). */
export function brandFulfillmentsToCsv(rows: BrandFulfillmentRow[]): string {
  const lines = [CSV_HEADERS.join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.recipient_name ?? '',
        row.ship_line1 ?? '',
        row.ship_line2 ?? '',
        row.ship_city ?? '',
        row.ship_state ?? '',
        row.ship_postal ?? '',
        row.ship_country ?? '',
        row.ship_phone ?? '',
        row.fulfillment_id,
        row.state,
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(',')
    )
  }
  return lines.join('\n')
}

/** Brand console: address changed — reprint the label (no “tell the brand”). */
export function brandAddressChangeCopy(
  change: AddressChange,
  nowMs: number = Date.now()
): string {
  const mins = Math.max(0, Math.floor((nowMs - new Date(change.changed_at).getTime()) / 60000))
  const when =
    mins < 60 ? `${mins}m ago` : mins < 48 * 60 ? `${Math.floor(mins / 60)}h ago` : 'earlier'
  const queued =
    change.state_at_change === 'fulfillment_pending' ? ', after it was queued' : ''
  return `Address changed ${when}${queued} · reprint the label`
}

export function packingHref(boxId: string): string {
  return `/studies/box/${boxId}/fulfillment`
}

/** sampling_boxes.id for a published IHUT mission (RLS-scoped). */
export async function resolveBoxIdForMission(
  supabase: Client,
  missionId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('sampling_boxes')
    .select('id')
    .eq('mission_id', missionId)
    .is('deleted_at', null)
    .maybeSingle()
  if (error || !data) return null
  return data.id
}

/** Attach box_id onto study list rows that have a sampling box (IHUT). */
export async function attachBoxIds<
  T extends { mission_id: string; test_type?: 'concept' | 'ihut' | null },
>(supabase: Client, rows: T[]): Promise<(T & { box_id: string | null })[]> {
  const missionIds = [
    ...new Set(
      rows
        .filter((row) => row.test_type === 'ihut')
        .map((row) => row.mission_id)
        .filter(Boolean)
    ),
  ]
  if (missionIds.length === 0) {
    return rows.map((row) => ({ ...row, box_id: null }))
  }

  const { data, error } = await supabase
    .from('sampling_boxes')
    .select('id, mission_id')
    .in('mission_id', missionIds)
    .is('deleted_at', null)

  const byMission = new Map<string, string>()
  if (!error && data) {
    for (const box of data) {
      byMission.set(box.mission_id, box.id)
    }
  }

  return rows.map((row) => ({
    ...row,
    box_id: byMission.get(row.mission_id) ?? null,
  }))
}

export type BrandSeatList = {
  rows: BrandFulfillmentRow[]
  holds: ShipHolds
  addressChanges: AddressChanges
}

export async function fetchBrandSeats(
  supabase: Client,
  boxId: string
): Promise<({ ok: true } & BrandSeatList) | { ok: false; error: string }> {
  const [list, holds, addressChanges] = await Promise.all([
    fetchBrandBoxFulfillments(supabase, boxId),
    fetchBoxShipHolds(supabase, boxId),
    fetchBoxAddressChanges(supabase, boxId),
  ])
  if (!list.ok) return list
  return {
    ok: true,
    rows: list.rows,
    holds: mergeBrandShipHolds(holds, list.rows),
    addressChanges,
  }
}
