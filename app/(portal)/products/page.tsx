import { redirect } from 'next/navigation'
import { getBrand, getPlatformCategoryStats, getMilestoneAlerts } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import {
  getBrandCatalogSummary,
  listBrandProductsPage,
} from '@/lib/brandHome/fetchBrandProductsPage.server'
import ProductsClient from './ProductsClient'
import AdminProductsClient from './AdminProductsClient'

export default async function ProductsPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope

  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    const [categoryStats, milestoneAlerts] = await Promise.all([
      getPlatformCategoryStats(),
      getMilestoneAlerts(),
    ])

    return (
      <AdminProductsClient
        portalUser={portalUser}
        categoryStats={categoryStats}
        milestoneAlerts={milestoneAlerts}
        statsLagHint="Category stats refresh about every 6 hours from mv_platform_category_stats."
      />
    )
  }

  const [brand, summary, firstPage] = await Promise.all([
    getBrand(effectiveBrandId),
    getBrandCatalogSummary(),
    listBrandProductsPage({ limit: 50 }),
  ])
  if (!brand) redirect('/login')

  return (
    <ProductsClient
      brand={brand}
      isImpersonating={isImpersonating}
      summary={summary}
      initialItems={firstPage?.items ?? []}
      initialHasMore={firstPage?.hasMore ?? false}
      initialCursor={firstPage?.nextCursor ?? null}
    />
  )
}
