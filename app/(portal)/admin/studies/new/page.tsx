import { redirect, notFound } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import {
  getBrand,
  getMissionWizardDraft,
  fetchPublishedMissionTemplates,
  validateCommissionProduct,
  type ValidatedCommissionProduct,
} from '@/lib/queries'
import IhutWizardClient from '../../../ihut/IhutWizardClient'

interface PageProps {
  searchParams: Promise<{
    brandId?: string
    productId?: string
    missionId?: string
  }>
}

/**
 * Operator commission wizard. URL params are hints only — brand and product
 * context are validated server-side before the wizard renders.
 */
export default async function AdminStudiesNewPage({ searchParams }: PageProps) {
  const { brandId: brandIdParam, productId: productIdParam, missionId } = await searchParams

  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser } = scope
  if (portalUser.role !== 'dough_admin') {
    redirect('/studies')
  }

  const brandId = brandIdParam ? parseInt(brandIdParam, 10) : NaN
  if (!Number.isFinite(brandId)) {
    redirect('/dashboard')
  }

  const brand = await getBrand(brandId)
  if (!brand) notFound()

  const resumedDraft = missionId
    ? await getMissionWizardDraft(missionId, brandId)
    : null

  if (missionId && !resumedDraft) redirect('/studies')

  let serverValidatedProduct: ValidatedCommissionProduct | null = null
  if (productIdParam) {
    const productId = parseInt(productIdParam, 10)
    if (!Number.isFinite(productId)) notFound()
    serverValidatedProduct = await validateCommissionProduct(productId, brandId)
    if (!serverValidatedProduct) notFound()
  }

  const missionTemplates = await fetchPublishedMissionTemplates()

  return (
    <IhutWizardClient
      portalUser={portalUser}
      brand={brand}
      operatorMode
      serverValidatedProduct={serverValidatedProduct}
      resumedDraft={resumedDraft}
      missionTemplates={missionTemplates}
    />
  )
}
