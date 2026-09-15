import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { listBrandWaitlistApplicationsPage } from '@/lib/brandApplications'
import BrandApplicationsClient from './BrandApplicationsClient'

export default async function AdminBrandApplicationsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  let initialRows: Awaited<ReturnType<typeof listBrandWaitlistApplicationsPage>>['rows'] = []
  let initialHasMore = false
  let initialCursor: Awaited<ReturnType<typeof listBrandWaitlistApplicationsPage>>['nextCursor'] =
    null
  let loadError: string | null = null
  try {
    const page = await listBrandWaitlistApplicationsPage(supabase, { limit: 25 })
    initialRows = page.rows
    initialHasMore = page.hasMore
    initialCursor = page.nextCursor
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Couldn’t load the applications queue.'
  }

  return (
    <BrandApplicationsClient
      initialRows={initialRows}
      initialHasMore={initialHasMore}
      initialCursor={initialCursor}
      initialError={loadError}
    />
  )
}
