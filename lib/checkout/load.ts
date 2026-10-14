import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { resolveStimuliPreviewUrl } from '@/lib/concept/stimuliStorage'
import { isStudyOrderStatus, type StudyOrderStatus } from './status'
import type { CheckoutThumb, StudyOrderRow, StudyRefundMethod } from './payment'

type Client = SupabaseClient<Database>

function intField(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    const n = Number(value)
    if (Number.isSafeInteger(n)) return n
  }
  return null
}

function optionalString(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value === 'string') return value
  return undefined
}

function refundMethod(value: unknown): StudyRefundMethod | null | undefined {
  if (value === null) return null
  if (value === 'refund' || value === 'credit') return value
  if (value === undefined) return null
  return undefined
}

export type StudyOrderSource = {
  mission_id: string
  brand_id: number
  title: string
  completions: number | string
  unit_price_cents: number | string
  amount_cents: number | string | null
  currency: string
  status: string
  payment_reference: string | null
  paid_at: string | null
  created_at: string
  settled_at?: string | null
  delivered_completions?: number | string | null
  refund_due_cents?: number | string | null
  refund_method?: string | null
  refund_reference?: string | null
  refunded_cents?: number | string | null
  refunded_at?: string | null
}

export function parseStudyOrder(row: StudyOrderSource): StudyOrderRow | null {
  if (!isStudyOrderStatus(row.status)) return null
  const unit = intField(row.unit_price_cents)
  const completions = intField(row.completions)
  if (unit == null || completions == null) return null
  const amount = intField(row.amount_cents) ?? unit * completions

  const settledAt = optionalString(row.settled_at ?? null)
  const refundReference = optionalString(row.refund_reference ?? null)
  const refundedAt = optionalString(row.refunded_at ?? null)
  const method = refundMethod(row.refund_method ?? null)
  if (
    settledAt === undefined ||
    refundReference === undefined ||
    refundedAt === undefined ||
    method === undefined
  ) {
    return null
  }

  let delivered: number | null = null
  if (row.delivered_completions != null && row.delivered_completions !== undefined) {
    delivered = intField(row.delivered_completions)
    if (delivered == null) return null
  }

  let refundDue: number | null = null
  if (row.refund_due_cents != null && row.refund_due_cents !== undefined) {
    refundDue = intField(row.refund_due_cents)
    if (refundDue == null) return null
  }

  let refundedCents: number | null = null
  if (row.refunded_cents != null && row.refunded_cents !== undefined) {
    refundedCents = intField(row.refunded_cents)
    if (refundedCents == null) return null
  }

  return {
    mission_id: row.mission_id,
    brand_id: row.brand_id,
    title: row.title,
    completions,
    unit_price_cents: unit,
    amount_cents: amount,
    currency: row.currency,
    status: row.status,
    payment_reference: row.payment_reference,
    paid_at: row.paid_at,
    created_at: row.created_at,
    settled_at: settledAt,
    delivered_completions: delivered,
    refund_due_cents: refundDue,
    refund_method: method,
    refund_reference: refundReference,
    refunded_cents: refundedCents,
    refunded_at: refundedAt,
  }
}

export const ORDER_COLUMNS =
  'mission_id, brand_id, title, completions, unit_price_cents, amount_cents, currency, status, payment_reference, paid_at, created_at, settled_at, delivered_completions, refund_due_cents, refund_method, refund_reference, refunded_cents, refunded_at'

export async function fetchOrdersForMissions(
  supabase: Client,
  missionIds: string[]
): Promise<Map<string, StudyOrderStatus>> {
  const ids = [...new Set(missionIds.filter(Boolean))]
  const out = new Map<string, StudyOrderStatus>()
  if (ids.length === 0) return out
  const { data, error } = await supabase
    .from('study_orders')
    .select('mission_id, status')
    .in('mission_id', ids)
  if (error || !data) return out
  for (const row of data) {
    if (isStudyOrderStatus(row.status)) out.set(row.mission_id, row.status)
  }
  return out
}

export async function attachOrderStatus<T extends { mission_id: string }>(
  supabase: Client,
  rows: T[]
): Promise<(T & { order_status: StudyOrderStatus | null })[]> {
  const orders = await fetchOrdersForMissions(
    supabase,
    rows.map((row) => row.mission_id)
  )
  return rows.map((row) => ({
    ...row,
    order_status: orders.get(row.mission_id) ?? null,
  }))
}

export async function fetchStudyOrder(
  supabase: Client,
  missionId: string
): Promise<StudyOrderRow | null> {
  const { data, error } = await supabase
    .from('study_orders')
    .select(ORDER_COLUMNS)
    .eq('mission_id', missionId)
    .maybeSingle()
  if (error || !data) return null
  return parseStudyOrder(data)
}

export async function fetchMissionCheckoutWindow(
  supabase: Client,
  missionId: string
): Promise<{
  fieldingDays: number | null
  expiresAt: string | null
  status: string | null
}> {
  const { data, error } = await supabase
    .from('missions')
    .select('fielding_days, expires_at, status')
    .eq('id', missionId)
    .maybeSingle()
  if (error || !data) return { fieldingDays: null, expiresAt: null, status: null }
  return {
    fieldingDays: data.fielding_days,
    expiresAt: data.expires_at,
    status: data.status,
  }
}

export async function fetchCheckoutField(
  supabase: Client,
  missionId: string
): Promise<{ designs: CheckoutThumb[]; products: CheckoutThumb[] }> {
  const { data, error } = await supabase
    .from('mission_combatants')
    .select('kind, frozen_display_name, frozen_image_url, display_order, deleted_at')
    .eq('mission_id', missionId)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
  if (error || !data) return { designs: [], products: [] }
  const thumbs = await Promise.all(
    data.map(async (row) => {
      const thumb: CheckoutThumb = {
        name: row.frozen_display_name,
        imageUrl: await resolveStimuliPreviewUrl(supabase, row.frozen_image_url),
        kind: row.kind === 'product' ? 'product' : 'design',
      }
      return { rowKind: row.kind, thumb }
    })
  )
  const designs: CheckoutThumb[] = []
  const products: CheckoutThumb[] = []
  for (const item of thumbs) {
    if (item.rowKind === 'product') products.push(item.thumb)
    else if (item.rowKind === 'concept') designs.push(item.thumb)
  }
  return { designs, products }
}

export async function fetchAwaitingOrders(supabase: Client): Promise<StudyOrderRow[]> {
  const { data, error } = await supabase
    .from('study_orders')
    .select(ORDER_COLUMNS)
    .eq('status', 'awaiting_payment')
    .order('created_at', { ascending: true })
    .limit(50)
  if (error || !data) return []
  return data.flatMap((row) => {
    const parsed = parseStudyOrder(row)
    return parsed ? [parsed] : []
  })
}

/** Settled orders that still owe a refund, oldest first. Staff desk only. */
export async function fetchRefundsOwed(
  supabase: Client,
  limit = 50
): Promise<StudyOrderRow[]> {
  const { data, error } = await supabase
    .from('study_orders')
    .select(ORDER_COLUMNS)
    .not('settled_at', 'is', null)
    .is('refunded_at', null)
    .gt('refund_due_cents', 0)
    .order('settled_at', { ascending: true })
    .limit(limit)
  if (error || !data) return []
  return data.flatMap((row) => {
    const parsed = parseStudyOrder(row)
    return parsed ? [parsed] : []
  })
}

export async function fetchConceptPrice(
  supabase: Client
): Promise<{ unit_price_cents: number; currency: string } | null> {
  const { data, error } = await supabase
    .from('study_prices')
    .select('unit_price_cents, currency')
    .eq('test_type', 'concept')
    .maybeSingle()
  if (error || !data) return null
  const cents = intField(data.unit_price_cents)
  if (cents == null) return null
  return { unit_price_cents: cents, currency: data.currency }
}
