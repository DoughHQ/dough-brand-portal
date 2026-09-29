import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import ConceptStudyClient from '../ConceptStudyClient'

export default async function NewConceptStudyPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const draft = createEmptyConceptDraft({
    brandId: scope.effectiveBrandId,
  })

  const canPublish = scope.portalUser.role !== 'brand_viewer'

  return (
    <ConceptStudyClient initialDraft={draft} mode="new" canPublish={canPublish} />
  )
}
