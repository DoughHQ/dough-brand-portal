import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrand } from '@/lib/queries'
import { getOperatorStudies } from '@/lib/studies/fetchOperatorStudies'
import { getWithdrawnStudies } from '@/lib/studies/fetchWithdrawnStudies'
import StudiesClient from './StudiesClient'
import AdminStudiesClient from './AdminStudiesClient'

export default async function StudiesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope

  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    const [studies, withdrawn] = await Promise.all([
      getOperatorStudies({ includeFinished: true, includeDrafts: true }),
      getWithdrawnStudies(),
    ])
    return <AdminStudiesClient studies={studies} withdrawn={withdrawn} />
  }

  const brand = await getBrand(effectiveBrandId)
  if (!brand) redirect('/login')

  return (
    <StudiesClient
      brandName={brand.brand_name}
      brandId={effectiveBrandId}
    />
  )
}
