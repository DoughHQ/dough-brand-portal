'use client'

import { useParams } from 'next/navigation'
import BoxPreviewWalkthroughClient from '../../preview/BoxPreviewWalkthroughClient'

export default function BoxStudyPreviewPage() {
  const params = useParams<{ draftId: string }>()
  const draftId = params.draftId
  if (!draftId) return null
  return <BoxPreviewWalkthroughClient draftId={draftId} />
}
