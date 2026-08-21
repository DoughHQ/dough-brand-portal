/**
 * Operator box detail + status-transition helpers.
 * Console-only; never imported by brand surfaces.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { BoxStatus } from './operator'

export type BoxFieldProduct = {
  product_id: number
  name: string
  brand: string
}

export type BoxSeatCounts = {
  claimed: number
  active: number
  completed: number
  abandoned: number
  delivery_failed: number
  claim_expired: number
  held: number
  available: number
}

export type BoxStatusEvent = {
  from_status: BoxStatus
  to_status: BoxStatus
  reason: string | null
  created_at: string
}

export type OperatorBoxDetail = {
  box_id: string
  mission_id: string
  title: string
  brand_id: number | null
  brand_name: string | null
  category_name: string | null
  status: BoxStatus
  physical_units: number
  session_count: number
  session2_interval_hours: number | null
  blind_sponsor: boolean
  abandon_window_days: number
  unit_cost_cents: number | null
  sourcing_notes: string | null
  expires_at: string | null
  starts_at: string | null
  created_at: string
  locked_at: string | null
  frozen_field: {
    frozen_at?: string
    focal_product_id?: number
    products?: BoxFieldProduct[]
  }
  seats: BoxSeatCounts
  history: BoxStatusEvent[]
}

type Client = SupabaseClient<Database>

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v != null && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>
  }
  return null
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function strOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function isBoxStatus(v: unknown): v is BoxStatus {
  return (
    v === 'draft' ||
    v === 'open' ||
    v === 'shipping' ||
    v === 'running' ||
    v === 'closed' ||
    v === 'archived'
  )
}

function parseProducts(raw: unknown): BoxFieldProduct[] {
  if (!Array.isArray(raw)) return []
  const out: BoxFieldProduct[] = []
  for (const item of raw) {
    const row = asRecord(item)
    if (!row) continue
    const product_id = numOrNull(row.product_id)
    if (product_id == null) continue
    out.push({
      product_id,
      name: str(row.name),
      brand: str(row.brand),
    })
  }
  return out
}

function parseSeats(raw: unknown): BoxSeatCounts {
  const row = asRecord(raw) ?? {}
  return {
    claimed: num(row.claimed),
    active: num(row.active),
    completed: num(row.completed),
    abandoned: num(row.abandoned),
    delivery_failed: num(row.delivery_failed),
    claim_expired: num(row.claim_expired),
    held: num(row.held),
    available: num(row.available),
  }
}

function parseHistory(raw: unknown): BoxStatusEvent[] {
  if (!Array.isArray(raw)) return []
  const out: BoxStatusEvent[] = []
  for (const item of raw) {
    const row = asRecord(item)
    if (!row || !isBoxStatus(row.from_status) || !isBoxStatus(row.to_status)) continue
    out.push({
      from_status: row.from_status,
      to_status: row.to_status,
      reason: strOrNull(row.reason),
      created_at: str(row.created_at),
    })
  }
  return out
}

function parseDetail(
  data: Json
): { ok: true; detail: OperatorBoxDetail } | { ok: false; error: string } {
  const obj = asRecord(data)
  if (!obj) return { ok: false, error: 'BOX_NOT_FOUND' }
  if (typeof obj.error === 'string') return { ok: false, error: obj.error }
  if (!isBoxStatus(obj.status) || typeof obj.box_id !== 'string') {
    return { ok: false, error: 'Malformed box detail.' }
  }
  const frozen = asRecord(obj.frozen_field) ?? {}
  return {
    ok: true,
    detail: {
      box_id: obj.box_id,
      mission_id: str(obj.mission_id),
      title: str(obj.title),
      brand_id: numOrNull(obj.brand_id),
      brand_name: strOrNull(obj.brand_name),
      category_name: strOrNull(obj.category_name),
      status: obj.status,
      physical_units: num(obj.physical_units),
      session_count: num(obj.session_count, 1),
      session2_interval_hours: numOrNull(obj.session2_interval_hours),
      blind_sponsor: obj.blind_sponsor === true,
      abandon_window_days: num(obj.abandon_window_days, 14),
      unit_cost_cents: numOrNull(obj.unit_cost_cents),
      sourcing_notes: strOrNull(obj.sourcing_notes),
      expires_at: strOrNull(obj.expires_at),
      starts_at: strOrNull(obj.starts_at),
      created_at: str(obj.created_at),
      locked_at: strOrNull(obj.locked_at),
      frozen_field: {
        frozen_at: typeof frozen.frozen_at === 'string' ? frozen.frozen_at : undefined,
        focal_product_id: numOrNull(frozen.focal_product_id) ?? undefined,
        products: parseProducts(frozen.products),
      },
      seats: parseSeats(obj.seats),
      history: parseHistory(obj.history),
    },
  }
}

export async function fetchBoxDetail(
  supabase: Client,
  boxId: string
): Promise<
  | { ok: true; detail: OperatorBoxDetail }
  | { ok: false; error: string; notFound?: boolean }
> {
  const { data, error } = await supabase.rpc('get_operator_box_detail', {
    p_box_id: boxId,
  })
  if (error) return { ok: false, error: error.message }
  const parsed = parseDetail(data)
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      notFound: parsed.error === 'BOX_NOT_FOUND',
    }
  }
  return { ok: true, detail: parsed.detail }
}

/** Legal status transitions, mirroring advance_box_status exactly. */
export function allowedTransitions(status: BoxStatus): BoxStatus[] {
  switch (status) {
    case 'draft':
      return ['open', 'archived']
    case 'open':
      return ['shipping', 'closed']
    case 'shipping':
      return ['open', 'running', 'closed']
    case 'running':
      return ['closed']
    case 'closed':
      return ['archived']
    case 'archived':
      return []
  }
}

/**
 * Seat buckets treated as mid-flight for the close preview.
 * Mirrors advance_box_status v_active: claimed / confirmed / fulfillment_pending /
 * shipped / delivered / session_1_active / session_1_complete / session_2_active.
 * Those SQL states land in claimed + active on this payload. held is the
 * leftover (everything except claim_expired) and includes completed/abandoned
 * — it must not gate Close.
 */
export function inFlightSeatCount(seats: BoxSeatCounts): number {
  return seats.claimed + seats.active
}

/** Client-side guard preview — returns a reason string if the transition is
 *  currently blocked, else null. Mirrors the server guards so the operator
 *  never hits a raw throw. */
export function transitionBlockReason(
  detail: OperatorBoxDetail,
  target: BoxStatus
): string | null {
  if (target === 'open') {
    const fieldSize = detail.frozen_field.products?.length ?? 0
    if (fieldSize < 1) return 'The field is empty — nothing to battle.'
    const now = Date.now()
    if (detail.starts_at && now < Date.parse(detail.starts_at)) {
      return 'The mission window has not started yet.'
    }
    if (detail.expires_at && now >= Date.parse(detail.expires_at)) {
      return 'The mission window has ended.'
    }
  }
  if (target === 'closed') {
    const inFlight = inFlightSeatCount(detail.seats)
    if (inFlight > 0) {
      return `${inFlight} respondent${inFlight === 1 ? '' : 's'} still in progress.`
    }
  }
  return null
}

/** Verb label for a transition button. */
export function transitionLabel(target: BoxStatus, from?: BoxStatus): string {
  switch (target) {
    case 'open':
      return from === 'shipping' ? 'Reopen claims' : 'Open for claims'
    case 'shipping':
      return 'Begin shipping'
    case 'running':
      return 'Mark running'
    case 'closed':
      return 'Close box'
    case 'archived':
      return 'Archive'
    case 'draft':
      return 'Reopen'
  }
}
