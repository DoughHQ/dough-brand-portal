import type { CSSProperties } from 'react'

const AMBER = '#C07818'
const AMBER_SOFT = 'rgba(192, 120, 24, 0.12)'

export function Chip({
  label,
  selected,
  onToggle,
  removable,
  onRemove,
  tone = 'default',
  locked,
}: {
  label: string
  selected?: boolean
  onToggle?: () => void
  removable?: boolean
  onRemove?: () => void
  tone?: 'default' | 'sage' | 'amber' | 'muted'
  locked?: boolean
}) {
  const styles: Record<string, CSSProperties> = {
    default: {
      border: selected ? '1.5px solid var(--sage)' : '1px solid var(--ink-10)',
      background: selected ? 'var(--sage)' : 'var(--paper)',
      color: selected ? 'var(--on-fill)' : 'var(--ink)',
      fontWeight: selected ? 600 : 500,
    },
    sage: {
      border: '1.5px solid var(--sage)',
      background: 'var(--sage)',
      color: 'var(--on-fill)',
      fontWeight: 600,
    },
    amber: {
      border: `1.5px solid ${AMBER}`,
      background: AMBER_SOFT,
      color: AMBER,
      fontWeight: 600,
    },
    muted: {
      border: '1px solid var(--ink-10)',
      background: 'var(--surface-1)',
      color: 'var(--ink-30)',
      fontWeight: 500,
    },
  }
  const base: CSSProperties = {
    ...styles[tone],
    borderRadius: 999,
    padding: removable ? '7px 10px 7px 12px' : '7px 12px',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }

  if (locked) {
    return (
      <span style={{ ...base, cursor: 'default' }}>
        {label}
        <span
          style={{
            marginLeft: 2,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.06em',
            opacity: 0.7,
          }}
        >
          LOCKED
        </span>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={removable ? onRemove : onToggle}
      style={{ ...base, cursor: 'pointer' }}
    >
      {label}
      {removable ? (
        <span aria-hidden style={{ fontSize: 14, lineHeight: 1, opacity: 0.85 }}>
          ×
        </span>
      ) : null}
    </button>
  )
}
