import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import ImpersonateBrandClient from './ImpersonateBrandClient'

export default async function AdminImpersonatePage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  if (scope.portalUser.role !== 'dough_admin') {
    redirect('/dashboard')
  }

  return (
    <ImpersonateBrandClient currentImpersonatedBrandId={scope.impersonatedBrandId} />
  )
}
