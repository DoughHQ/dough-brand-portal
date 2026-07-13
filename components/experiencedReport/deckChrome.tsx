import type { ReactNode } from 'react'

const DECK_WIDTH = 920

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'pro' | 'amber'
}) {
  const colors =
    tone === 'pro'
      ? { color: 'var(--text-pro)', background: 'var(--bg-pro)' }
      : tone === 'amber'
        ? { color: 'var(--amber)', background: 'var(--amber-soft)' }
        : { color: 'var(--ink-muted)', background: 'var(--surface-1)' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 4,
        ...colors,
      }}
    >
      {children}
    </span>
  )
}

export function SectionShell({
  title,
  sub,
  children,
  caveat,
}: {
  title: string
  sub?: string
  caveat?: string | null
  children: ReactNode
}) {
  return (
    <section
      style={{
        maxWidth: DECK_WIDTH,
        margin: '0 auto',
        padding: '40px 28px 48px',
        borderTop: '1px solid var(--mist)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
          color: 'var(--ink)',
        }}
      >
        {title}
      </h2>
      {sub ? (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--ink-muted)',
            margin: '0 0 8px',
            lineHeight: 1.5,
            maxWidth: 640,
          }}
        >
          {sub}
        </p>
      ) : null}
      {caveat ? (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--ink-faint)',
            fontStyle: 'italic',
            margin: '0 0 24px',
            maxWidth: 640,
            lineHeight: 1.45,
          }}
        >
          {caveat}
        </p>
      ) : (
        <div style={{ height: sub ? 16 : 20 }} />
      )}
      {children}
    </section>
  )
}

export function ProportionTrack({
  value,
  ciLow,
  ciHigh,
  own = true,
}: {
  value: number
  ciLow: number | null
  ciHigh: number | null
  own?: boolean
}) {
  const mid = Math.max(0, Math.min(100, value <= 1 ? value * 100 : value))
  const lo =
    ciLow != null ? Math.max(0, Math.min(100, ciLow <= 1 ? ciLow * 100 : ciLow)) : null
  const hi =
    ciHigh != null ? Math.max(0, Math.min(100, ciHigh <= 1 ? ciHigh * 100 : ciHigh)) : null

  return (
    <div
      style={{
        position: 'relative',
        height: 18,
        background: 'var(--surface-1)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 8,
      }}
      aria-hidden
    >
      {lo != null && hi != null ? (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(lo, hi)}%`,
            width: `${Math.abs(hi - lo)}%`,
            top: 0,
            bottom: 0,
            background: own ? 'var(--fill-pro)' : 'var(--border-strong)',
            opacity: own ? 1 : 0.35,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: `calc(${mid}% - 1.25px)`,
          width: 2.5,
          top: 0,
          bottom: 0,
          background: own ? 'var(--text-pro)' : 'var(--ink)',
        }}
      />
    </div>
  )
}

export { DECK_WIDTH }
