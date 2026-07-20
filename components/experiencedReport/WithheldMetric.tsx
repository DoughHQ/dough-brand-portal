import { plainWithheldReason } from '@/lib/experiencedReport/withheldCopy'

type Props = {
  metric: {
    reportable: boolean
    withheld_reason?: string | null
    n_answers?: number | null
    n_decisive?: number | null
    n_users?: number | null
    n_positive?: number | null
    n_citing?: number | null
  }
  /** Extra context when reason lacks embedded floor numbers */
  label?: string
  children?: React.ReactNode
}

/** Reportable → children. Withheld → plain reason + raw counts. Never 0. */
export function WithheldMetric({ metric, label, children }: Props) {
  if (metric.reportable) {
    return <>{children}</>
  }

  const reason = plainWithheldReason(metric.withheld_reason, {
    n_answers: metric.n_answers,
    n_decisive: metric.n_decisive,
    n_users: metric.n_users,
    n_positive: metric.n_positive,
    n_citing: metric.n_citing,
  })

  const counts: string[] = []
  if (metric.n_answers != null) counts.push(`${metric.n_answers} answers`)
  if (metric.n_decisive != null) counts.push(`${metric.n_decisive} decisive`)
  if (metric.n_positive != null && metric.n_answers != null) {
    counts.push(`${metric.n_positive} of ${metric.n_answers} positive`)
  } else if (metric.n_citing != null) {
    counts.push(`${metric.n_citing} citing`)
  }

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        lineHeight: 1.5,
        color: 'var(--ink-muted)',
        background: 'var(--surface-1)',
        borderRadius: 8,
        padding: '12px 14px',
        border: '1px dashed var(--mist)',
      }}
    >
      {label ? (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      ) : null}
      <div style={{ color: 'var(--ink)', fontWeight: 500 }}>{reason}</div>
      {counts.length > 0 ? (
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-faint)' }}>
          {counts.join(' · ')}
        </div>
      ) : null}
    </div>
  )
}
