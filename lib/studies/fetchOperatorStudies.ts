import { createServerSupabaseClient } from '@/lib/supabase-server'
import { parseOperatorStudyRows } from './parseOperatorStudies'
import type { OperatorStudyRow } from './types'

export type StudiesPageTab = 'active' | 'complete'

export type StudiesPageCursor = {
  createdAt: string
  id: string
}

export type StudiesPage = {
  rows: OperatorStudyRow[]
  hasMore: boolean
  nextCursor: StudiesPageCursor | null
  tab: StudiesPageTab
}

type Client = Awaited<ReturnType<typeof createServerSupabaseClient>>

function parsePage(data: unknown, tab: StudiesPageTab): StudiesPage {
  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const items = Array.isArray(root.items) ? root.items : []
  const rows = parseOperatorStudyRows(items)
  const cursorRaw =
    root.next_cursor && typeof root.next_cursor === 'object'
      ? (root.next_cursor as Record<string, unknown>)
      : null
  const nextCursor =
    root.has_more === true && cursorRaw?.id != null && cursorRaw.created_at != null
      ? { createdAt: String(cursorRaw.created_at), id: String(cursorRaw.id) }
      : null
  return {
    rows,
    hasMore: root.has_more === true && nextCursor != null,
    nextCursor,
    tab,
  }
}

/** Prefer this over getOperatorStudies — keyset ≤50 per tab. */
export async function fetchOperatorStudiesPage(
  opts: {
    tab: StudiesPageTab
    limit?: number
    cursor?: StudiesPageCursor | null
    brandId?: number | null
    includeDrafts?: boolean
  },
  supabase?: Client
): Promise<{ ok: true; page: StudiesPage } | { ok: false; error: string }> {
  const client = supabase ?? (await createServerSupabaseClient())
  const { data, error } = await client.rpc('list_operator_studies_page' as never, {
    p_limit: opts.limit ?? 25,
    p_cursor_created_at: opts.cursor?.createdAt ?? null,
    p_cursor_id: opts.cursor?.id ?? null,
    p_tab: opts.tab,
    p_brand_id: (opts.brandId ?? null) as number | null,
    p_include_drafts: opts.includeDrafts ?? false,
  } as never)

  if (error) return { ok: false, error: error.message }
  return { ok: true, page: parsePage(data, opts.tab) }
}

/**
 * @deprecated FORBIDDEN — throws. Prefer fetchOperatorStudiesPage.
 */
export async function getOperatorStudies(_options?: {
  includeFinished?: boolean
  includeDrafts?: boolean
  brandId?: number | null
}): Promise<never> {
  throw new Error(
    'FORBIDDEN: getOperatorStudies is unbounded. Use fetchOperatorStudiesPage (list_operator_studies_page).'
  )
}
