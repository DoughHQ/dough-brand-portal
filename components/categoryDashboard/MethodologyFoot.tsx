import type { CategoryReport } from '@/lib/categoryReport/types'

export function MethodologyFoot({
  report,
  showRanking,
}: {
  report: CategoryReport
  showRanking: boolean
}) {
  return (
    <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--mist)' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 8,
        }}
      >
        Methodology
      </div>
      {report.meta.elo_note ? (
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-50)',
            lineHeight: 1.55,
            margin: '0 0 8px',
            maxWidth: 720,
          }}
        >
          {report.meta.elo_note}
        </p>
      ) : null}
      {report.gate.message && showRanking ? (
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-50)',
            lineHeight: 1.55,
            margin: '0 0 8px',
            maxWidth: 720,
          }}
        >
          {report.gate.message}
        </p>
      ) : null}
    </div>
  )
}
