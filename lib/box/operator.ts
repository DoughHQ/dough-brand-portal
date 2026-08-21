/**
 * Operator-side box read model. Wraps list_operator_boxes and the box_status
 * enum. Console-only (admin-gated in Postgres); never imported by brand
 * surfaces.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type BoxStatus = Database['public']['Enums']['box_status']

export type OperatorBoxRow =
  Database['public']['Functions']['list_operator_boxes']['Returns'][number]

type Client = SupabaseClient<Database>

export async function fetchOperatorBoxes(
  supabase: Client,
  opts?: { includeArchived?: boolean }
): Promise<{ ok: true; rows: OperatorBoxRow[] } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('list_operator_boxes', {
    p_include_archived: opts?.includeArchived ?? false,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
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
  }
}

/** Which tab a status belongs to. */
export type BoxTab = 'draft' | 'live' | 'closed'

export function tabForBoxStatus(status: BoxStatus): BoxTab {
  if (status === 'draft') return 'draft'
  if (status === 'closed' || status === 'archived') return 'closed'
  return 'live' // open, shipping, running
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
