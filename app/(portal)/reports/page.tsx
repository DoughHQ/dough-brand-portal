import { redirect } from 'next/navigation'
import { getBrand, getSubscription } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope

  const [brand, subscription] = await Promise.all([
    getBrand(effectiveBrandId),
    getSubscription(effectiveBrandId),
  ])
  if (!brand) redirect('/login')

  const isAdmin = portalUser.role === 'dough_admin'

  return (
    <ReportsClient
      portalUser={portalUser}
      brand={brand}
      subscription={subscription}
      isAdmin={isAdmin}
      isImpersonating={isImpersonating}
      brandId={effectiveBrandId}
    />
  )
}
