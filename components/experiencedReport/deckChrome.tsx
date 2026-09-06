import type { ReactNode } from 'react'

const DECK_WIDTH = 1280

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

export function MethodNote({
  sectionNumber,
  notes,
}: {
  sectionNumber: number
  notes: string[]
}) {
  if (notes.length === 0) return null
  return (
    <details className="report-method-note no-print">
      <summary aria-label={`Methodology for section ${sectionNumber}`}>ⓘ</summary>
      <div className="report-method-panel">
        {notes.map((note) => (
          <p key={note.slice(0, 80)}>{note}</p>
        ))}
      </div>
    </details>
  )
}

export function SectionShell({
  id,
  number,
  title,
  sub,
  notes,
  children,
}: {
  id: string
  number: number
  title: string
  sub?: string | string[]
  notes?: string[]
  children: ReactNode
}) {
  const subs = (Array.isArray(sub) ? sub : sub ? [sub] : []).filter(
    (s) => typeof s === 'string' && s.trim()
  )
  const methodNotes = notes ?? []

  return (
    <section id={id} className="report-section">
      <div className="report-section-heading">
        <span className="report-section-num">{number}</span>
        <h2>{title}</h2>
        <MethodNote sectionNumber={number} notes={methodNotes} />
      </div>
      {subs.length > 0 ? (
        <div className="report-section-sub">
          {subs.map((line) => (
            <p key={line.slice(0, 80)}>{line}</p>
          ))}
        </div>
      ) : (
        <div style={{ height: 12 }} />
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
          left: '50%',
          width: 1,
          top: 0,
          bottom: 0,
          background: 'var(--ink-faint)',
          opacity: 0.45,
        }}
      />
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

export function CoinFlipTrack({
  value,
  ciLow,
  ciHigh,
  tone = 'own',
}: {
  value: number
  ciLow: number | null
  ciHigh: number | null
  tone?: 'own' | 'against'
}) {
  const mid = Math.max(0, Math.min(100, value <= 1 ? value * 100 : value))
  const lo =
    ciLow != null ? Math.max(0, Math.min(100, ciLow <= 1 ? ciLow * 100 : ciLow)) : null
  const hi =
    ciHigh != null ? Math.max(0, Math.min(100, ciHigh <= 1 ? ciHigh * 100 : ciHigh)) : null
  const fill = tone === 'own' ? 'var(--fill-pro)' : 'var(--clay-soft)'
  const mark = tone === 'own' ? 'var(--sage-dark)' : 'var(--clay)'

  return (
    <div className="coin-flip-track" aria-hidden>
      <div className="coin-flip-rail">
        {lo != null && hi != null ? (
          <div
            className="coin-flip-ci"
            style={{
              left: `${Math.min(lo, hi)}%`,
              width: `${Math.abs(hi - lo)}%`,
              background: fill,
            }}
          />
        ) : null}
        <div className="coin-flip-fifty" />
        <div
          className="coin-flip-point"
          style={{ left: `calc(${mid}% - 1.5px)`, background: mark }}
        />
      </div>
      <div className="coin-flip-fifty-label">50</div>
    </div>
  )
}

/** Citation share — fill encodes outcome (for / against), not magnitude-as-quality. */
export function ShareBar({
  share,
  tone,
}: {
  share: number
  tone: 'own' | 'against'
}) {
  const pct = Math.max(0, Math.min(100, share <= 1 ? share * 100 : share))
  return (
    <div
      className={`share-bar share-bar--${tone}`}
      aria-hidden
    >
      <div
        className="share-bar-fill"
        style={{
          width: `${pct}%`,
          background: tone === 'own' ? 'var(--sage)' : 'var(--clay)',
        }}
      />
    </div>
  )
}

/** Best-minus-worst — zero is neither compelling nor objectionable. Not a ranking bar. */
export function BipolarTrack({
  score,
  ciLow,
  ciHigh,
  showLabels = false,
}: {
  score: number | null
  ciLow: number | null
  ciHigh: number | null
  showLabels?: boolean
}) {
  const clamp01 = (v: number) => Math.max(-1, Math.min(1, v))
  const toPct = (v: number) => 50 + clamp01(v) * 50
  const fill =
    score == null || Math.abs(score) < 0.05
      ? 'var(--ink-faint)'
      : score < 0
        ? 'var(--clay)'
        : 'var(--sage)'
  const start = score == null ? 50 : score < 0 ? toPct(score) : 50
  const width = score == null ? 0 : Math.abs(clamp01(score)) * 50
  const ciLeft = ciLow != null ? toPct(ciLow) : null
  const ciRight = ciHigh != null ? toPct(ciHigh) : null

  return (
    <div className="bipolar-track" aria-hidden>
      <div className="bipolar-rail">
        {ciLeft != null && ciRight != null ? (
          <div
            className="bipolar-ci"
            style={{
              left: `${Math.min(ciLeft, ciRight)}%`,
              width: `${Math.abs(ciRight - ciLeft)}%`,
            }}
          />
        ) : null}
        <div className="bipolar-zero" />
        <div
          className="bipolar-fill"
          style={{ left: `${start}%`, width: `${width}%`, background: fill }}
        />
      </div>
      {showLabels ? (
        <div className="bipolar-labels">
          <span>Objectionable</span>
          <span>Compelling</span>
        </div>
      ) : null}
    </div>
  )
}

export { DECK_WIDTH }
