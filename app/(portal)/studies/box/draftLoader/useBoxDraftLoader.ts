'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BoxStudyDraft } from '@/lib/box/types'
import { loadBoxDraft, normalizeStoredBoxDraft } from '@/lib/box/draftStore'

export function useBoxDraftLoader(draftId: string, effectiveBrandId: number) {
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

  return draft
}
