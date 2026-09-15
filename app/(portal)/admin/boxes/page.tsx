import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fetchOperatorBoxesPage, type BoxTab } from '@/lib/box/operator'
import AdminBoxesClient from './AdminBoxesClient'

function parseTab(raw: string | string[] | undefined): BoxTab {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (v === 'draft' || v === 'live' || v === 'closed') return v
  return 'live'
}

export default async function AdminBoxesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')
  if (scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    redirect('/studies')
  }

  const params = typeof (searchParams as { then?: unknown })?.then === 'function'
    ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
    : (searchParams as Record<string, string | string[] | undefined> | undefined)

  const tab = parseTab(params?.tab)
  const supabase = await createServerSupabaseClient()
  const result = await fetchOperatorBoxesPage(supabase, {
    tab,
    includeArchived: false,
    limit: 25,
  })

  return (
    <AdminBoxesClient
      initialRows={result.ok ? result.page.rows : []}
      initialHasMore={result.ok ? result.page.hasMore : false}
      initialCursor={result.ok ? result.page.nextCursor : null}
      initialTab={tab}
      loadError={result.ok ? null : result.error}
    />
  )
}
