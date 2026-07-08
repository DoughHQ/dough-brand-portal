import { redirect } from 'next/navigation'
import { getBrand, getSubscription, getBrandProducts, getPlatformCategoryStats, getMilestoneAlerts } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
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
      />
    )
  }

  const [brand, subscription] = await Promise.all([
    getBrand(effectiveBrandId),
    getSubscription(effectiveBrandId),
  ])
  if (!brand) redirect('/login')

  const claimedIds = subscription?.claimed_product_ids ?? []
  const products = await getBrandProducts(effectiveBrandId, claimedIds)

  return (
    <ProductsClient
      portalUser={portalUser}
      brand={brand}
      subscription={subscription}
      products={products}
      claimedIds={claimedIds}
      isImpersonating={isImpersonating}
    />
  )
}
