import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'

/** Legacy operator commission wizard — retired; use /studies/new. */
export default async function AdminStudiesNewPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')
  redirect('/studies')
}
