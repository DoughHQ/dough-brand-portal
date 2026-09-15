import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { listPendingOwnershipCorrectionsPage } from '@/lib/ownershipCorrections'
import OwnershipCorrectionsClient from './OwnershipCorrectionsClient'

export default async function AdminOwnershipCorrectionsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  let initialRows: Awaited<ReturnType<typeof listPendingOwnershipCorrectionsPage>>['rows'] = []
  let initialHasMore = false
  let initialCursor: Awaited<ReturnType<typeof listPendingOwnershipCorrectionsPage>>['nextCursor'] =
    null
  let loadError: string | null = null
  try {
    const page = await listPendingOwnershipCorrectionsPage(supabase, { limit: 25 })
    initialRows = page.rows
    initialHasMore = page.hasMore
    initialCursor = page.nextCursor
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Couldn’t load the ownership queue.'
  }

  return (
    <OwnershipCorrectionsClient
      initialRows={initialRows}
      initialHasMore={initialHasMore}
      initialCursor={initialCursor}
      initialError={loadError}
    />
  )
}
