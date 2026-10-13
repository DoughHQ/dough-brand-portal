'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getConceptDraft } from '@/lib/concept/draftStore'
import type { ConceptStudyDraft } from '@/lib/concept/types'

export function useEditConceptDraft() {
  const params = useParams<{ missionId: string }>()
  const router = useRouter()
  const [draft, setDraft] = useState<ConceptStudyDraft | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const id = params.missionId
    if (!id) return
    const found = getConceptDraft(id)
    if (found) {
      setDraft(found)
    } else {
      setMissing(true)
    }
  }, [params.missionId])

  return { draft, missing, router }
}
