import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { listOpenUserReports } from '@/lib/safety'
import { parseSafetyFocus } from '@/lib/safety.shared'
import SafetyDeskClient from './SafetyDeskClient'

export default async function AdminSafetyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const params = searchParams ? await searchParams : undefined
  const focusId = parseSafetyFocus(params)
  const page = await listOpenUserReports({ limit: 50 })

  return (
    <SafetyDeskClient
      initialRows={page.rows}
      initialTotal={page.total}
      focusId={focusId}
      loadError={page.ok ? null : page.error ?? 'Could not load the safety inbox.'}
      renderedAt={Date.now()}
    />
  )
}
