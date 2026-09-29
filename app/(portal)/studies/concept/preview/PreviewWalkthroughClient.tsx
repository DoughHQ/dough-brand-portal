'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

/**
 * Legacy questionnaire walkthrough removed — concept is CORE-only.
 * Preview lives in the builder journey outline (Section 2).
 */
export default function PreviewWalkthroughClient({ draftId }: { draftId?: string }) {
  const params = useParams()
  const id = draftId ?? (typeof params?.draftId === 'string' ? params.draftId : null)
  const editHref = id ? `/studies/concept/${id}/edit` : '/studies'

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '64px auto',
        padding: 24,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400 }}>
        Preview is in the builder
      </h1>
      <p style={{ color: 'var(--ink-muted)', lineHeight: 1.5 }}>
        The respondent journey outline is on the Journey step of the study editor.
        Open the study and use Preview there to jump to it.
      </p>
      <Link href={editHref} style={{ color: 'var(--sage-dark)' }}>
        ← Back to editor
      </Link>
    </div>
  )
}
