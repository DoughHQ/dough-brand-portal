import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import { CONCEPT_DEFAULT_BRAND_ID } from '@/lib/concept/constants'
import ConceptStudyClient from '../ConceptStudyClient'

export default async function NewConceptStudyPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')
  if (scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    redirect('/studies')
  }

  const draft = createEmptyConceptDraft({
    brandId: CONCEPT_DEFAULT_BRAND_ID,
  })

  return <ConceptStudyClient initialDraft={draft} mode="new" />
}
