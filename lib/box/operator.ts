/**
 * Operator-side box read model. Prefers list_operator_boxes_page (tab keyset).
 * Console-only (admin-gated in Postgres); never imported by brand surfaces.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type BoxStatus = Database['public']['Enums']['box_status']

export type OperatorBoxRow = {
  box_id: string
  mission_id: string
  title: string
  brand_id: number | null
  brand_name: string | null
  taxonomy_node_id: number | null
  category_name: string | null
  status: BoxStatus
  physical_units: number
  session_count: number
  blind_sponsor: boolean
  field_size: number
  seats_claimed: number
  seats_active: number
  seats_completed: number
  seats_abandoned: number
  seats_delivery_failed: number
  seats_available: number
  expires_at: string | null
  created_at: string
  locked_at: string | null
}

/** Which tab a status belongs to. */
export type BoxTab = 'draft' | 'live' | 'closed'

export type OperatorBoxesPageCursor = {
  createdAt: string
  id: string
}

export type OperatorBoxesPage = {
  rows: OperatorBoxRow[]
  hasMore: boolean
  nextCursor: OperatorBoxesPageCursor | null
  tab: BoxTab
}

type Client = SupabaseClient<Database>

function asBoxRow(raw: unknown): OperatorBoxRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const boxId = o.box_id != null ? String(o.box_id) : ''
  if (!boxId) return null
  const status = String(o.status ?? '') as BoxStatus
  return {
    box_id: boxId,
    mission_id: String(o.mission_id ?? ''),
    title: String(o.title ?? 'Untitled box'),
    brand_id: o.brand_id == null ? null : Number(o.brand_id),
    brand_name: o.brand_name == null ? null : String(o.brand_name),
    taxonomy_node_id: o.taxonomy_node_id == null ? null : Number(o.taxonomy_node_id),
    category_name: o.category_name == null ? null : String(o.category_name),
    status,
    physical_units: Number(o.physical_units) || 0,
    session_count: Number(o.session_count) || 0,
    blind_sponsor: Boolean(o.blind_sponsor),
    field_size: Number(o.field_size) || 0,
    seats_claimed: Number(o.seats_claimed) || 0,
    seats_active: Number(o.seats_active) || 0,
    seats_completed: Number(o.seats_completed) || 0,
    seats_abandoned: Number(o.seats_abandoned) || 0,
    seats_delivery_failed: Number(o.seats_delivery_failed) || 0,
    seats_available: Number(o.seats_available) || 0,
    expires_at: o.expires_at == null ? null : String(o.expires_at),
    created_at: String(o.created_at ?? ''),
    locked_at: o.locked_at == null ? null : String(o.locked_at),
  }
}

export async function fetchOperatorBoxesPage(
  supabase: Client,
  opts: {
    tab: BoxTab
    includeArchived?: boolean
    limit?: number
    cursor?: OperatorBoxesPageCursor | null
  }
): Promise<{ ok: true; page: OperatorBoxesPage } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('list_operator_boxes_page' as never, {
    p_limit: opts.limit ?? 25,
    p_cursor_created_at: opts.cursor?.createdAt ?? null,
    p_cursor_id: opts.cursor?.id ?? null,
    p_tab: opts.tab,
    p_include_archived: opts.includeArchived ?? false,
  } as never)
  if (error) return { ok: false, error: error.message }

  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const items = Array.isArray(root.items) ? root.items : []
  const rows = items.map(asBoxRow).filter((r): r is OperatorBoxRow => r != null)
  const cursorRaw =
    root.next_cursor && typeof root.next_cursor === 'object'
      ? (root.next_cursor as Record<string, unknown>)
      : null
  const nextCursor =
    root.has_more === true && cursorRaw?.id != null && cursorRaw.created_at != null
      ? { createdAt: String(cursorRaw.created_at), id: String(cursorRaw.id) }
      : null

  return {
    ok: true,
    page: {
      rows,
      hasMore: root.has_more === true && nextCursor != null,
      nextCursor,
      tab: opts.tab,
    },
  }
}

/** @deprecated FORBIDDEN — throws. Prefer fetchOperatorBoxesPage. */
export async function fetchOperatorBoxes(
  _supabase: Client,
  _opts?: { includeArchived?: boolean }
): Promise<never> {
  throw new Error(
    'FORBIDDEN: fetchOperatorBoxes is capped legacy. Use fetchOperatorBoxesPage (list_operator_boxes_page).'
  )
}

/** Human label per status. */
export function boxStatusLabel(status: BoxStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'open':
      return 'Open for claims'
    case 'shipping':
      return 'Shipping'
    case 'running':
      return 'Running'
    case 'closed':
      return 'Closed'
    case 'archived':
      return 'Archived'
    default:
      return String(status)
  }
}

export function tabForBoxStatus(status: BoxStatus): BoxTab {
  if (status === 'draft') return 'draft'
  if (status === 'closed' || status === 'archived') return 'closed'
  return 'live'
}

/** Badge colors shared by the list and the detail header. */
export const BOX_STATUS_TONE: Record<BoxStatus, { bg: string; fg: string }> = {
  draft: { bg: 'var(--surface-1)', fg: 'var(--ink-50)' },
  open: { bg: 'var(--sage-soft)', fg: 'var(--sage-dark)' },
  shipping: { bg: 'var(--amber-pale)', fg: 'var(--amber)' },
  running: { bg: 'var(--sage-soft)', fg: 'var(--sage-dark)' },
  closed: { bg: 'var(--surface-1)', fg: 'var(--ink-50)' },
  archived: { bg: 'var(--surface-1)', fg: 'var(--ink-30)' },
}
