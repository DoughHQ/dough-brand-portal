'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getConceptDraft } from '@/lib/concept/draftStore'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import ConceptStudyClient from '../../ConceptStudyClient'

/**
 * Edit a local concept draft. Draft ids live in localStorage until publish.
 * Published missions land on /studies/concept/[missionId] (status stub).
 */
export default function EditConceptStudyPage() {
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

  if (missing) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          maxWidth: 560,
          margin: '80px auto',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400 }}>
          Draft not found
        </h1>
        <p style={{ color: 'var(--ink-50)', fontSize: 14 }}>
          This concept draft isn&apos;t in this browser. Start a new one, or open it where it
          was saved.
        </p>
        <button
          type="button"
          onClick={() => router.push('/studies/concept/new')}
          style={{
            marginTop: 16,
            border: 'none',
            background: 'var(--sage)',
            color: 'var(--white)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 600,
            padding: '10px 18px',
            borderRadius: 'var(--r-sm)',
            cursor: 'pointer',
          }}
        >
          New concept study
        </button>
      </div>
    )
  }

  if (!draft) {
    return (
      <div style={{ fontFamily: 'var(--font-sans)', padding: 48, color: 'var(--ink-50)' }}>
        Loading draft…
      </div>
    )
  }

  return <ConceptStudyClient initialDraft={draft} mode="edit" />
}
