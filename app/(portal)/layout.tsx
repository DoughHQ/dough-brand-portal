import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getBrand, getSubscription } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import PortalLayoutClient from './PortalLayoutClient'
import LegacyBrandIdGate from './components/LegacyBrandIdGate'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope
  const isAdmin = portalUser.role === 'dough_admin'

  let brand = null
  let subscription = null
  let claimedCount = 0

  if (!isAdmin || isImpersonating) {
    const [loadedBrand, loadedSubscription] = await Promise.all([
      getBrand(effectiveBrandId),
      getSubscription(effectiveBrandId),
    ])
    if (!loadedBrand) redirect('/login')
    brand = loadedBrand
    subscription = loadedSubscription
    claimedCount = subscription?.claimed_product_ids?.length ?? 0
  }

  return (
    <Suspense fallback={null}>
      <PortalLayoutClient
        brand={brand}
        portalUser={portalUser}
        subscription={subscription}
        claimedCount={claimedCount}
        isAdmin={isAdmin}
        isImpersonating={isImpersonating}
        impersonatedBrandName={isImpersonating && brand ? brand.brand_name : null}
      >
        <LegacyBrandIdGate isAdmin={isAdmin} isImpersonating={isImpersonating}>
          {children}
        </LegacyBrandIdGate>
      </PortalLayoutClient>
    </Suspense>
  )
}
