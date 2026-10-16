import type { CSSProperties } from 'react'
import { focalLeadSentence } from '@/lib/categoryReport/copy'
import type { CategoryReport, RankedProduct } from '@/lib/categoryReport/types'

const belowFoldH2: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 18,
  fontWeight: 400,
  color: 'var(--ink)',
  margin: '0 0 8px',
  letterSpacing: '-0.01em',
}

export function FocalCut({ report }: { report: CategoryReport }) {
  const focal = report.focal
  if (!focal) return null
  const hasAny = focal.above.length + focal.tied.length + focal.below.length > 0
  if (!hasAny && !focal.method_note) return null

  const groups: { key: string; label: string; rows: RankedProduct[] }[] = [
    { key: 'above', label: 'Ahead of you', rows: focal.above },
    { key: 'tied', label: 'Statistically tied', rows: focal.tied },
    { key: 'below', label: 'Behind you', rows: focal.below },
  ]
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={belowFoldH2}>Versus {focal.name}</h2>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: '0 0 14px', lineHeight: 1.5 }}>
        {focalLeadSentence(focal.above.length, focal.tied.length, focal.below.length)}
      </p>
      {hasAny ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {groups.map((g) => (
            <div key={g.key} style={{ minHeight: 64 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: g.key === 'tied' ? 'var(--sage)' : 'var(--ink-30)',
                  marginBottom: 10,
                }}
              >
                {g.label}
                <span style={{ fontWeight: 400, marginLeft: 6 }}>{g.rows.length}</span>
              </div>
              {g.rows.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>—</div>
              ) : (
                g.rows.map((p) => (
                  <div key={p.product_id} style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}>
                    {p.name}
                    <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>{p.brand}</div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ) : null}
      {focal.method_note ? (
        <p style={{ fontSize: 12, color: 'var(--ink-30)', margin: '12px 0 0', lineHeight: 1.5 }}>
          {focal.method_note}
        </p>
      ) : null}
    </section>
  )
}
