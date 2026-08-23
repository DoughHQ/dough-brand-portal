import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrand } from '@/lib/queries'
import { getOperatorStudies } from '@/lib/studies/fetchOperatorStudies'
import { getWithdrawnStudies } from '@/lib/studies/fetchWithdrawnStudies'
import { listStudyDraftsAction } from './drafts/actions'
import StudiesClient from './StudiesClient'

export default async function StudiesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope
  const canOperate = portalUser.role === 'dough_admin' && !isImpersonating

  const [studies, withdrawn, draftsResult] = await Promise.all([
    getOperatorStudies({
      includeFinished: true,
      includeDrafts: false,
    }),
    canOperate ? getWithdrawnStudies() : Promise.resolve([]),
    listStudyDraftsAction(),
  ])

  const drafts = (draftsResult.ok ? draftsResult.drafts : [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

  let brandName: string | null = 'Platform'
  if (!canOperate) {
    const brand = await getBrand(effectiveBrandId)
    if (!brand) redirect('/login')
    brandName = brand.brand_name
  }

  return (
    <StudiesClient
      studies={studies}
      withdrawn={withdrawn}
      drafts={drafts}
      effectiveBrandId={effectiveBrandId}
      canOperate={canOperate}
      brandName={brandName}
    />
  )
}
