import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fetchOperatorBoxes } from '@/lib/box/operator'
import AdminBoxesClient from './AdminBoxesClient'

export default async function AdminBoxesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')
  // Strict operator gate — impersonating admins are redirected out, because the
  // box RPCs execute under the admin's Postgres identity regardless of the
  // impersonated brand.
  if (scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    redirect('/studies')
  }

  const supabase = await createServerSupabaseClient()
  const result = await fetchOperatorBoxes(supabase, { includeArchived: false })
  const rows = result.ok ? result.rows : []

  return <AdminBoxesClient initialRows={rows} loadError={result.ok ? null : result.error} />
}
