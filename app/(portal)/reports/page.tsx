import { redirect } from 'next/navigation'
import { getBrand } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrandReportScope } from '@/lib/brandHome/fetchBrandReportScope.server'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope
  const isAdmin = portalUser.role === 'dough_admin'

  // Catalog storefront is platform-shell only — brands (and impersonation) use Categories.
  if (!isAdmin || isImpersonating) redirect('/categories')

  const [brand, reportScope] = await Promise.all([
    getBrand(effectiveBrandId),
    getBrandReportScope(),
  ])
  if (!brand) redirect('/login')

  return (
    <ReportsClient
      brand={brand}
      isAdmin={isAdmin}
      brandId={effectiveBrandId}
      brandCategoryIds={reportScope?.l2NodeIds ?? []}
    />
  )
}
