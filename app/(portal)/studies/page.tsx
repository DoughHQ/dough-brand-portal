import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrand, getOperatorDraftMissions } from '@/lib/queries'
import { getOperatorStudies } from '@/lib/studies/fetchOperatorStudies'
import { getWithdrawnStudies } from '@/lib/studies/fetchWithdrawnStudies'
import StudiesClient from './StudiesClient'
import AdminStudiesClient from './AdminStudiesClient'

export default async function StudiesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope

  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    const [drafts, studies, withdrawn] = await Promise.all([
      getOperatorDraftMissions(portalUser.auth_uid),
      getOperatorStudies({ includeFinished: true }),
      getWithdrawnStudies(),
    ])
    return (
      <AdminStudiesClient drafts={drafts} studies={studies} withdrawn={withdrawn} />
    )
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
