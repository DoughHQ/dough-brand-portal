import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { listBrandWaitlistApplications } from '@/lib/brandApplications'
import BrandApplicationsClient from './BrandApplicationsClient'

export default async function AdminBrandApplicationsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  let initialRows: Awaited<ReturnType<typeof listBrandWaitlistApplications>> = []
  let loadError: string | null = null
  try {
    initialRows = await listBrandWaitlistApplications(supabase)
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Couldn’t load the applications queue.'
  }

  return <BrandApplicationsClient initialRows={initialRows} initialError={loadError} />
}
