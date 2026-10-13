'use client'

/**
 * Drafts live only in localStorage until publish, so the edit route must load
 * client-side. Missing draft → back to a fresh builder rather than a dead page.
 */
import BoxStudyClient from './BoxStudyClient'
import { useBoxDraftLoader } from './draftLoader/useBoxDraftLoader'

type Props = {
  draftId: string
  effectiveBrandId: number
  isImpersonating: boolean
}

export default function BoxDraftLoader({
  draftId,
  effectiveBrandId,
  isImpersonating,
}: Props) {
  const draft = useBoxDraftLoader(draftId, effectiveBrandId)

  if (!draft) return null

  return (
    <BoxStudyClient
      initialDraft={draft}
      mode="edit"
      isImpersonating={isImpersonating}
    />
  )
}
