import { formatAsOf, formatCount } from '@/lib/categoryReport/copy'
import type { CategoryReport } from '@/lib/categoryReport/types'

/** Honest metric strip — counts only, never coverage %. */
export default function MetricStrip({ report }: { report: CategoryReport }) {
  const e = report.evidence
  const items: { label: string; value: string }[] = [
    { label: 'As of', value: formatAsOf(report.meta.as_of) },
    {
      label: 'Distinct raters',
      value: `${formatCount(e.distinct_raters)} / ${formatCount(e.rater_threshold)}`,
    },
    { label: 'Battles', value: formatCount(e.battles) },
    { label: 'Products battled', value: formatCount(e.products_battled) },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px 32px',
        padding: '16px 0',
        borderTop: '1px solid var(--mist)',
        borderBottom: '1px solid var(--mist)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {items.map((item) => (
        <div key={item.label}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
              marginBottom: 4,
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 18,
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}
