import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  getPortalUser, getBrand, getSubscription, getBrandSnapshot,
  getBrandSnapshotHistory, getProductIntelligence, getCompetitiveSnapshot,
  getAllBrandProducts, generateNarrative, getPlatformStats, getBrandProductCount,
} from '@/lib/queries'
import DashboardClient from './DashboardClient'
import AdminDashboardClient from './AdminDashboardClient'

interface PageProps {
  searchParams: Promise<{ brand_id?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  try {
    const { brand_id } = await searchParams

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    const portalUser = await getPortalUser()
    if (!portalUser) redirect('/login')

    const parsedBrandId = brand_id ? parseInt(brand_id, 10) : NaN
    const impersonatedBrandId =
      portalUser.role === 'dough_admin' && Number.isFinite(parsedBrandId) ? parsedBrandId : null

    // Admin path with no impersonation
    if (portalUser.role === 'dough_admin' && !impersonatedBrandId) {
      const stats = await getPlatformStats()
      return <AdminDashboardClient portalUser={portalUser} stats={stats} />
    }

    // Admin impersonating a brand, OR regular brand user
    const targetBrandId = impersonatedBrandId ?? portalUser.brand_id

    const [brand, subscription, snapshot, history, competitive, allProducts, totalProductCount] = await Promise.all([
      getBrand(targetBrandId),
      getSubscription(targetBrandId),
      getBrandSnapshot(targetBrandId),
      getBrandSnapshotHistory(targetBrandId, 30),
      getCompetitiveSnapshot(targetBrandId),
      getAllBrandProducts(targetBrandId),
      getBrandProductCount(targetBrandId),
    ])
    if (!brand) redirect('/login')

    const claimedIds = subscription?.claimed_product_ids ?? []
    const productIntelligence = await getProductIntelligence(targetBrandId, claimedIds)
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
        isImpersonating={portalUser.role === 'dough_admin' && !!impersonatedBrandId}
      />
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/login')
  }
}
