import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { listPendingOwnershipCorrections } from '@/lib/ownershipCorrections'
import OwnershipCorrectionsClient from './OwnershipCorrectionsClient'

export default async function AdminOwnershipCorrectionsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  let initialRows: Awaited<ReturnType<typeof listPendingOwnershipCorrections>> = []
  let loadError: string | null = null
  try {
    initialRows = await listPendingOwnershipCorrections(supabase)
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Couldn’t load the ownership queue.'
  }

  return <OwnershipCorrectionsClient initialRows={initialRows} initialError={loadError} />
}
