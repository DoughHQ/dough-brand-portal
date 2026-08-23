'use client'

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
  const label = title?.trim() || 'Untitled study'

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
      <div style={{ minWidth: 0, flex: '1 1 200px' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--sage-dark)',
            marginBottom: 3,
          }}
        >
          Resume your draft?
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-50)',
            lineHeight: 1.45,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
          <span style={{ color: 'var(--ink-30)' }}> · saved {whenLabel}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          type="button"
          disabled={busy}
          onClick={onStartFresh}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: busy ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink-50)',
            padding: '8px 10px',
            opacity: busy ? 0.5 : 1,
          }}
        >
          Start fresh
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onResume}
          style={{
            border: 'none',
            background: 'var(--sage)',
            color: 'var(--white, #fff)',
            cursor: busy ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 600,
            padding: '9px 14px',
            borderRadius: 8,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Loading…' : 'Resume'}
        </button>
      </div>
    </div>
  )
}
