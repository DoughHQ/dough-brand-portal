import { redirect } from 'next/navigation'
import { getBrand } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrandReportScope } from '@/lib/brandHome/fetchBrandReportScope.server'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope

  const [brand, reportScope] = await Promise.all([
    getBrand(effectiveBrandId),
    getBrandReportScope(),
  ])
  if (!brand) redirect('/login')

  const isAdmin = portalUser.role === 'dough_admin'

  return (
    <ReportsClient
      brand={brand}
      isAdmin={isAdmin}
      isImpersonating={isImpersonating}
      brandId={effectiveBrandId}
      brandCategoryIds={reportScope?.l2NodeIds ?? []}
    />
  )
}
