import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import {
  asApplicationRow,
  BrandApplicationsError,
  extractApplications,
  friendlyBrandApplicationsError,
  sortApplicationsForQueue,
  type ApplicationStatus,
  type BrandApplication,
} from './brandApplicationModel'

function extractCode(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('42501') || lower.includes('not authorized') || lower.includes('not_authorized')) {
    return 'not_authorized'
  }
  if (lower.includes('not_found') || lower.includes('application_not_found')) {
    return 'not_found'
  }
  if (lower.includes('invites_disabled')) {
    return 'invites_disabled'
  }
  if (lower.includes('invalid_decision')) {
    return 'invalid_decision'
  }
  return 'review_failed'
}

type ApplicationsRpcClient = Pick<SupabaseClient<Database>, 'rpc'>

export type BrandApplicationsPageCursor = {
  statusRank: number
  createdAt: string
  id: string
}

export type BrandApplicationsPage = {
  rows: BrandApplication[]
  hasMore: boolean
  nextCursor: BrandApplicationsPageCursor | null
}

export async function listBrandWaitlistApplicationsPage(
  supabase: ApplicationsRpcClient,
  opts?: {
    limit?: number
    cursor?: BrandApplicationsPageCursor | null
    status?: ApplicationStatus | null
  }
): Promise<BrandApplicationsPage> {
  const { data, error } = await supabase.rpc('list_brand_waitlist_applications_page' as never, {
    p_limit: opts?.limit ?? 25,
    p_cursor_rank: opts?.cursor?.statusRank ?? null,
    p_cursor_created_at: opts?.cursor?.createdAt ?? null,
    p_cursor_id: opts?.cursor?.id ?? null,
    p_status: opts?.status ?? null,
  } as never)

  if (error) {
    throw new BrandApplicationsError(
      extractCode(error.message),
      friendlyBrandApplicationsError(error.message).includes('permission')
        ? friendlyBrandApplicationsError(error.message)
        : 'Couldn’t load the applications queue.'
    )
  }

  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const rows = extractApplications(root)
    .map(asApplicationRow)
    .filter((r): r is BrandApplication => r != null)

  const cursorRaw =
    root.next_cursor && typeof root.next_cursor === 'object'
      ? (root.next_cursor as Record<string, unknown>)
      : null
  const nextCursor =
    root.has_more === true &&
    cursorRaw?.id != null &&
    cursorRaw.created_at != null &&
    cursorRaw.status_rank != null
      ? {
          statusRank: Number(cursorRaw.status_rank),
          createdAt: String(cursorRaw.created_at),
          id: String(cursorRaw.id),
        }
      : null

  return {
    rows: sortApplicationsForQueue(rows),
    hasMore: root.has_more === true && nextCursor != null,
    nextCursor,
  }
}

export async function listBrandWaitlistApplications(
  supabase: ApplicationsRpcClient
): Promise<BrandApplication[]> {
  const page = await listBrandWaitlistApplicationsPage(supabase, { limit: 50 })
  return page.rows
}
