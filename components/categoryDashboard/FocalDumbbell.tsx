'use client'

import { focalPairRows, formatCount } from '@/lib/categoryReport/copy'
import type { CategoryPairwise } from '@/lib/categoryReport/types'

export default function FocalDumbbell({
  pairwise,
  focalProductId,
  focalName,
}: {
  pairwise: CategoryPairwise
  focalProductId: number
  focalName: string
}) {
  const rows = focalPairRows(pairwise.pairs, focalProductId)
  if (rows.length === 0) return null

  return (
    <section style={{ marginBottom: 40 }}>
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
        {focalName} vs the field
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: '0 0 12px', lineHeight: 1.45 }}>
        Model probability that {focalName} beats each opponent (payload P only — never inverted).
      </p>
      <div
        style={{
          display: 'flex',
          gap: 16,
          fontSize: 11,
          color: 'var(--ink-50)',
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--sage, #3E6B4A)',
              verticalAlign: 'middle',
              marginRight: 6,
            }}
          />
          Directly compared
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--sage, #3E6B4A)',
              opacity: 0.55,
              border: '1px dashed rgba(36, 61, 44, 0.5)',
              verticalAlign: 'middle',
              marginRight: 6,
              boxSizing: 'border-box',
            }}
          />
          Model-implied (never met)
        </span>
      </div>
      <div>
        {rows.map((row, i) => {
          const p = row.p_focal_beats
          const left = p != null ? Math.max(0, Math.min(100, p * 100)) : null
          return (
            <div
              key={row.opponent_id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px, 220px) 1fr 88px',
                gap: 12,
                alignItems: 'center',
                padding: '12px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--ink-10)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.opponent_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 2 }}>
                  observed {row.observed_focal_wins ?? '—'}–{row.observed_opp_wins ?? '—'}
                  {row.observed_n != null ? ` (n=${formatCount(row.observed_n)})` : ''}
                  {row.directly_compared ? '' : ' · implied'}
                </div>
              </div>
              <div style={{ position: 'relative', height: 28 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 13,
                    height: 1,
                    background: 'var(--ink-10)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 8,
                    width: 1,
                    height: 12,
                    background: 'var(--ink-10)',
                  }}
                />
                {left != null ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(${left}% - 6px)`,
                      top: 8,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: 'var(--sage, #3E6B4A)',
                      opacity: row.directly_compared ? 1 : 0.55,
                      border: row.directly_compared
                        ? 'none'
                        : '1px dashed rgba(36, 61, 44, 0.6)',
                      boxShadow: '0 0 0 2px var(--paper, #fff)',
                      boxSizing: 'border-box',
                    }}
                    title={p != null ? `P = ${p}` : undefined}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 6,
                      fontSize: 11,
                      color: 'var(--ink-30)',
                    }}
                  >
                    P not in payload
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  color: p != null ? 'var(--ink)' : 'var(--ink-30)',
                }}
              >
                {p != null ? p.toFixed(2) : '—'}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
