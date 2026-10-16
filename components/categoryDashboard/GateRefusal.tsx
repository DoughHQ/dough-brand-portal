import { formatAsOf, formatCount } from '@/lib/categoryReport/copy'
import type { CategoryReport } from '@/lib/categoryReport/types'

export function GateRefusal({ report }: { report: CategoryReport }) {
  const e = report.evidence
  return (
    <div
      style={{
        background: 'var(--paper)',
        borderRadius: 4,
        padding: '48px 40px',
        boxShadow: '0 0 0 1px var(--mist)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 12,
        }}
      >
        Below reporting floor
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 32,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 12px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        Not enough distinct people yet
      </h2>
      <p
        style={{
          fontSize: 16,
          color: 'var(--ink-80)',
          lineHeight: 1.55,
          maxWidth: 560,
          margin: '0 0 28px',
        }}
      >
        {report.gate.message ??
          'A brand cannot see a ranking until enough distinct people have battled in this category.'}
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 28,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>Raters</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>
            {formatCount(e.distinct_raters)}
            <span style={{ fontSize: 14, color: 'var(--ink-30)' }}>
              {' '}
              / {formatCount(e.rater_threshold)}
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>Battles</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>
            {formatCount(e.battles)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>
            Products battled
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>
            {formatCount(e.products_battled)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>As of</div>
          <div style={{ fontSize: 16, color: 'var(--ink)' }}>{formatAsOf(report.meta.as_of)}</div>
        </div>
      </div>
    </div>
  )
}
