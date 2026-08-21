'use client'

/**
 * Drafts live only in localStorage until publish, so the edit route must load
 * client-side. Missing draft → back to a fresh builder rather than a dead page.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BoxStudyDraft } from '@/lib/box/types'
import { loadBoxDraft, normalizeStoredBoxDraft } from '@/lib/box/draftStore'
import BoxStudyClient from './BoxStudyClient'

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
  const router = useRouter()
  const [draft, setDraft] = useState<BoxStudyDraft | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const stored = loadBoxDraft(draftId)
    if (!stored) {
      setMissing(true)
      return
    }
    setDraft(normalizeStoredBoxDraft(stored, effectiveBrandId))
  }, [draftId, effectiveBrandId])

  useEffect(() => {
    if (missing) router.replace('/studies/box/new')
  }, [missing, router])

  if (!draft) return null

  return (
    <BoxStudyClient
      initialDraft={draft}
      mode="edit"
      isImpersonating={isImpersonating}
    />
  )
}
