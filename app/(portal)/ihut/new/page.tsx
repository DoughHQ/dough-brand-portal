import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'

/** Legacy template wizard — retired; use /studies/new. */
export default async function IhutNewPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')
  redirect('/studies')
}
