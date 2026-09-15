import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrand } from '@/lib/queries'
import { fetchOperatorStudiesPage } from '@/lib/studies/fetchOperatorStudies'
import { getWithdrawnStudies } from '@/lib/studies/fetchWithdrawnStudies'
import { listStudyDraftsAction } from './drafts/actions'
import StudiesClient from './StudiesClient'

export default async function StudiesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope
  const canOperate = portalUser.role === 'dough_admin' && !isImpersonating
  const brandId = canOperate ? null : effectiveBrandId

  const [activeResult, completeResult, withdrawn, draftsResult] = await Promise.all([
    fetchOperatorStudiesPage({
      tab: 'active',
      limit: 25,
      brandId,
      includeDrafts: false,
    }),
    fetchOperatorStudiesPage({
      tab: 'complete',
      limit: 25,
      brandId,
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

  const loadError =
    (!activeResult.ok ? activeResult.error : null) ??
    (!completeResult.ok ? completeResult.error : null)

  return (
    <StudiesClient
      initialActive={activeResult.ok ? activeResult.page.rows : []}
      initialActiveHasMore={activeResult.ok ? activeResult.page.hasMore : false}
      initialActiveCursor={activeResult.ok ? activeResult.page.nextCursor : null}
      initialComplete={completeResult.ok ? completeResult.page.rows : []}
      initialCompleteHasMore={completeResult.ok ? completeResult.page.hasMore : false}
      initialCompleteCursor={completeResult.ok ? completeResult.page.nextCursor : null}
      withdrawn={withdrawn}
      drafts={drafts}
      effectiveBrandId={effectiveBrandId}
      canOperate={canOperate}
      brandName={brandName}
      loadError={loadError}
    />
  )
}
