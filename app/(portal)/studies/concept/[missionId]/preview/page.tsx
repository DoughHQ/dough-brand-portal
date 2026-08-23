'use client'

import { useParams } from 'next/navigation'
import PreviewWalkthroughClient from '../../preview/PreviewWalkthroughClient'

export default function ConceptStudyPreviewPage() {
  const params = useParams<{ missionId: string }>()
  const draftId = params.missionId
  if (!draftId) return null
  return <PreviewWalkthroughClient draftId={draftId} />
}
