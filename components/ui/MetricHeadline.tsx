import { formatPct } from '@/lib/portal-ui/format'

export type MetricHeadlineProps = {
  value: number | null
  ciLow: number | null
  ciHigh: number | null
  n_users: number | null
  n_decisive: number | null
  reportable: boolean
  withheldReason?: string | null
  estimandLabel: string
}

export function MetricHeadline({
  value,
  ciLow,
  ciHigh,
  n_users,
  n_decisive,
  reportable,
  withheldReason,
  estimandLabel,
}: MetricHeadlineProps) {
  const showValue = reportable && value != null

  return (
    <header style={{ marginBottom: 'var(--space-4)' }}>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {estimandLabel}
      </div>

      {showValue ? (
        <>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              gap: '12px 16px',
              marginBottom: 'var(--space-2)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 8vw, 56px)',
                fontWeight: 400,
                color: 'var(--sage-dark)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {formatPct(value)}
            </span>
            {ciLow != null && ciHigh != null ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  color: 'var(--ink-muted)',
                  letterSpacing: '-0.01em',
                }}
              >
                [{formatPct(ciLow)}–{formatPct(ciHigh)}]
              </span>
            ) : null}
          </div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink-muted)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Based on {n_users ?? '—'} respondent{n_users === 1 ? '' : 's'}
            {n_decisive != null
              ? ` · ${n_decisive} comparison${n_decisive === 1 ? '' : 's'}`
              : ''}
          </p>
        </>
      ) : (
        <>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 36px)',
              fontWeight: 400,
              color: 'var(--sage-dark)',
              lineHeight: 1.15,
              marginBottom: 'var(--space-2)',
            }}
          >
            Results pending
          </div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink-muted)',
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 520,
            }}
          >
            {n_users != null ? `${n_users} respondent${n_users === 1 ? '' : 's'} so far` : 'Sample still building'}
            {withheldReason ? ` — ${withheldReason}` : ' — more comparisons needed before we report.'}
          </p>
        </>
      )}
    </header>
  )
}
