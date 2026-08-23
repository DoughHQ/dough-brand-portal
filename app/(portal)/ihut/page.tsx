import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'

/** Legacy Launch IHUT list — retired; creation lives under /studies. */
export default async function IhutPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')
  redirect('/studies')
}
