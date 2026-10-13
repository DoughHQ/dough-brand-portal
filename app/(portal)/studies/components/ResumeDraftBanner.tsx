'use client'

import ResumeDraftActions from './resumeDraft/ResumeDraftActions'
import ResumeDraftCopy from './resumeDraft/ResumeDraftCopy'

type Props = {
  title: string | null
  whenLabel: string
  busy?: boolean
  onResume: () => void
  onStartFresh: () => void
}

/**
 * Inline resume affordance for study /new routes — warm brand shell, not a modal.
 */
export default function ResumeDraftBanner({
  title,
  whenLabel,
  busy,
  onResume,
  onStartFresh,
}: Props) {
  return (
    <div
      role="region"
      aria-label="Resume draft"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        marginBottom: 20,
        padding: '14px 16px',
        background: 'var(--sage-soft, var(--sage-pale))',
        border: '1px solid rgba(62, 107, 74, 0.22)',
        borderRadius: 12,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <ResumeDraftCopy title={title} whenLabel={whenLabel} />
      <ResumeDraftActions busy={busy} onResume={onResume} onStartFresh={onStartFresh} />
    </div>
  )
}
