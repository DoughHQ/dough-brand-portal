import { redirect } from 'next/navigation'
import {
  getBrand,
  getSubscription,
  getBrandSnapshot,
  getBrandSnapshotHistory,
  getProductIntelligence,
  getCompetitiveSnapshot,
  getBrandProductCount,
  getTopBrandProducts,
  getBrandProductsByIds,
  generateNarrative,
  getPlatformStats,
} from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchBrandCategoryLauncherServer } from '@/lib/categoryLauncher.server'
import {
  competeCategoriesFromLauncher,
  entitledL2IdsFromLauncher,
  launcherRowsToBrandCategoryL2,
} from '@/lib/categoryLauncher'
import { getOperatorStudies } from '@/lib/studies/fetchOperatorStudies'
import { selectHomeModel } from '@/lib/brandHome/selectHomeModel'
import { fetchProductSignalCards } from '@/lib/brandHome/fetchProductSignalCards.server'
import { fetchBrandTotalBattles } from '@/lib/brandHome/fetchBrandTotalBattles.server'
import { perfLog, perfNow, timed } from '@/lib/perf'
import DashboardClient from './DashboardClient'
import AdminDashboardClient from './AdminDashboardClient'

const HOME_PRODUCT_LIMIT = 24

export default async function DashboardPage() {
  const tPage = perfNow()
  try {
    const scope = await getPortalBrandScope()
    if (!scope) redirect('/login')

    const { portalUser, effectiveBrandId, isImpersonating } = scope

    if (portalUser.role === 'dough_admin' && !isImpersonating) {
      const stats = await timed('dashboard.platformStats', () => getPlatformStats())
      perfLog('dashboard.page.total', perfNow() - tPage, { shell: 'platform' })
      return <AdminDashboardClient stats={stats} />
    }

    const tParallel = perfNow()
    const [
      brand,
      subscription,
      snapshot,
      history,
      competitive,
      totalProductCount,
      topProducts,
      launcher,
      studies,
      signalCards,
      totalBattles,
    ] = await Promise.all([
      getBrand(effectiveBrandId),
      getSubscription(effectiveBrandId),
      getBrandSnapshot(effectiveBrandId),
      getBrandSnapshotHistory(effectiveBrandId, 30),
      getCompetitiveSnapshot(effectiveBrandId),
      getBrandProductCount(effectiveBrandId),
      getTopBrandProducts(effectiveBrandId, HOME_PRODUCT_LIMIT),
      fetchBrandCategoryLauncherServer(),
      getOperatorStudies({
        includeFinished: true,
        includeDrafts: true,
        brandId: effectiveBrandId,
      }).catch(() => []),
      fetchProductSignalCards(effectiveBrandId),
      fetchBrandTotalBattles(),
    ])

    const competeRows = competeCategoriesFromLauncher(launcher)
    const categories = launcherRowsToBrandCategoryL2(competeRows)
    const unlockedL2Ids = entitledL2IdsFromLauncher(launcher)

    perfLog('dashboard.brandParallel', perfNow() - tParallel, {
      brandId: effectiveBrandId,
      productRows: topProducts.length,
      productCount: totalProductCount,
      categories: categories.length,
    })

    if (!brand) redirect('/login')

    const claimedIds = subscription?.claimed_product_ids ?? []
    const [productIntelligence, claimedNames] = await Promise.all([
      timed('dashboard.productIntelligence', () =>
        getProductIntelligence(effectiveBrandId, claimedIds)
      ),
      getBrandProductsByIds(effectiveBrandId, claimedIds),
    ])

    const nameById = new Map<number, { product_id: number; product_name_display: string; total_battles: number }>()
    for (const p of topProducts) {
      nameById.set(p.product_id, {
        product_id: p.product_id,
        product_name_display: p.product_name_display,
        total_battles: p.total_battles,
      })
    }
    for (const p of claimedNames) nameById.set(p.product_id, p)
    const productNames = [...nameById.values()]

    const narrative = snapshot
      ? generateNarrative(snapshot, brand.brand_name)
      : {
          headline: `${brand.brand_name} is in the Dough database. Data builds as battles are recorded.`,
          sub: 'Updated daily',
        }

    const homeModel = selectHomeModel({
      brandName: brand.brand_name,
      narrative,
      snapshot,
      categories,
      studies,
      productIntelligence,
      productNames,
      unlockedL2Ids,
    })

    perfLog('dashboard.page.total', perfNow() - tPage, {
      shell: 'brand',
      brandId: effectiveBrandId,
      productRows: topProducts.length,
      productCount: totalProductCount,
    })

    return (
      <DashboardClient
        portalUser={portalUser}
        brand={brand}
        subscription={subscription}
        snapshot={snapshot}
        history={history}
        productIntelligence={productIntelligence}
        competitive={competitive}
        allProducts={topProducts}
        narrative={narrative}
        totalProductCount={totalProductCount}
        totalBattles={totalBattles}
        isImpersonating={isImpersonating}
        homeModel={homeModel}
        categoriesCount={categories.length}
        signalCards={signalCards}
      />
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/login')
  }
}
