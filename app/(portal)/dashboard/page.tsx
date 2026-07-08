import { redirect } from 'next/navigation'
import {
  getBrand, getSubscription, getBrandSnapshot,
  getBrandSnapshotHistory, getProductIntelligence, getCompetitiveSnapshot,
  getAllBrandProducts, generateNarrative, getPlatformStats, getBrandProductCount,
} from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import DashboardClient from './DashboardClient'
import AdminDashboardClient from './AdminDashboardClient'

export default async function DashboardPage() {
  try {
    const scope = await getPortalBrandScope()
    if (!scope) redirect('/login')

    const { portalUser, effectiveBrandId, isImpersonating } = scope

    if (portalUser.role === 'dough_admin' && !isImpersonating) {
      const stats = await getPlatformStats()
      return <AdminDashboardClient stats={stats} />
    }

    const [brand, subscription, snapshot, history, competitive, allProducts, totalProductCount] = await Promise.all([
      getBrand(effectiveBrandId),
      getSubscription(effectiveBrandId),
      getBrandSnapshot(effectiveBrandId),
      getBrandSnapshotHistory(effectiveBrandId, 30),
      getCompetitiveSnapshot(effectiveBrandId),
      getAllBrandProducts(effectiveBrandId),
      getBrandProductCount(effectiveBrandId),
    ])
    if (!brand) redirect('/login')

    const claimedIds = subscription?.claimed_product_ids ?? []
    const productIntelligence = await getProductIntelligence(effectiveBrandId, claimedIds)
    const narrative = snapshot
      ? generateNarrative(snapshot, brand.brand_name)
      : {
          headline: `${brand.brand_name} is in the Dough database. Data builds as battles are recorded.`,
          sub: 'Updated daily',
        }

    return (
      <DashboardClient
        portalUser={portalUser}
        brand={brand}
        subscription={subscription}
        snapshot={snapshot}
        history={history}
        productIntelligence={productIntelligence}
        competitive={competitive}
        allProducts={allProducts}
        narrative={narrative}
        totalProductCount={totalProductCount}
        isImpersonating={isImpersonating}
      />
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/login')
  }
}
