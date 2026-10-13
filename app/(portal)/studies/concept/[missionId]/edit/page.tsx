'use client'

import ConceptStudyClient from '../../ConceptStudyClient'
import ConceptDraftLoading from './draft/ConceptDraftLoading'
import ConceptDraftMissing from './draft/ConceptDraftMissing'
import { useEditConceptDraft } from './draft/useEditConceptDraft'

/**
 * Edit a local concept draft. Draft ids live in localStorage until publish.
 * Published missions land on /studies/concept/[missionId] (status stub).
 */
export default function EditConceptStudyPage() {
  const { draft, missing, router } = useEditConceptDraft()

  if (missing) {
    return <ConceptDraftMissing onStartNew={() => router.push('/studies/concept/new')} />
  }

  if (!draft) {
    return <ConceptDraftLoading />
  }

  return <ConceptStudyClient initialDraft={draft} mode="edit" />
}
