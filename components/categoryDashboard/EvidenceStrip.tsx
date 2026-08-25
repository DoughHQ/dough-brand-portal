import { formatCount, formatSharePct } from '@/lib/categoryReport/copy'
import type { CategoryReport } from '@/lib/categoryReport/types'

/**
 * Quiet evidence footer for brand Overview — one strip, not four cards.
 * Still counts/shares only; never invents coverage %.
 */
export default function EvidenceStrip({ report }: { report: CategoryReport }) {
  const e = report.evidence
  const cov = e.coverage
  const conc = e.concentration

  const cells: { label: string; value: string; note?: string | null }[] = [
    {
      label: 'Ranked',
      value: formatCount(cov?.products_ranked ?? null),
    },
    {
      label: 'With battles',
      value: formatCount(cov?.products_with_battles ?? null),
    },
    {
      label: 'Active in scope',
      value: formatCount(cov?.products_active_in_scope ?? null),
    },
    {
      label: 'Top-3 battle share',
      value: formatSharePct(conc?.top3_battle_share ?? null) ?? '—',
    },
  ]

  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 6px',
          letterSpacing: '-0.01em',
        }}
      >
        Evidence
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: '0 0 16px', lineHeight: 1.45 }}>
        Counts from this category — not a catalog percentage.
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px 40px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {cells.map((c) => (
          <div key={c.label}>
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
              {c.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>
      {cov?.note || conc?.note ? (
        <p style={{ fontSize: 12, color: 'var(--ink-30)', margin: '14px 0 0', lineHeight: 1.45 }}>
          {[cov?.note, conc?.note].filter(Boolean).join(' · ')}
        </p>
      ) : null}
    </section>
  )
}
