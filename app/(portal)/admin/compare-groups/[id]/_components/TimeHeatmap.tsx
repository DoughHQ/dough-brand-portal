'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import type { CompareGroupMetrics } from '@/lib/compareGroups.shared'

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

type Layer = 'observed' | 'editorial'

type Props = {
  metrics: CompareGroupMetrics | null
}

function formatHourAmpm(h: number): string {
  if (h === 0 || h === 24) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function formatHourRange(start: number): string {
  const end = start + 2
  if (start < 12 && end >= 12) {
    return `${formatHourAmpm(start)}–${formatHourAmpm(end)}`
  }
  if (start >= 12 && end < 24) {
    return `${formatHourAmpm(start)}–${formatHourAmpm(end)}`
  }
  return `${formatHourAmpm(start)}–${formatHourAmpm(end)}`
}

function computePeak(
  cells: Array<{ hour: number; dow: number; battles: number }>
): string | null {
  if (!cells.length) return null

  const grid = new Map<string, number>()
  for (const c of cells) {
    grid.set(`${c.dow}-${c.hour}`, c.battles)
  }

  let bestSum = -1
  let bestDow = 0
  let bestHour = 0

  for (let dow = 0; dow < 7; dow++) {
    for (let h = 0; h < 24; h++) {
      let sum = 0
      for (let k = 0; k < 3; k++) {
        const hour = h + k
        if (hour >= 24) break
        sum += grid.get(`${dow}-${hour}`) ?? 0
      }
      if (sum > bestSum) {
        bestSum = sum
        bestDow = dow
        bestHour = h
      }
    }
  }

  if (bestSum <= 0) return null
  return `Peak: ${DOW_LABELS[bestDow]} ${formatHourRange(bestHour)}`
}

export default function TimeHeatmap({ metrics }: Props) {
  const observed = metrics?.observed_time_of_day ?? []
  const editorial = metrics?.editorial_time_priors ?? []
  const observedEmpty = observed.length === 0
  const editorialEmpty = editorial.length === 0

  const [layer, setLayer] = useState<Layer>(() =>
    observedEmpty && !editorialEmpty ? 'editorial' : 'observed'
  )

  const { grid, maxVal } = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
    let max = 0

    if (layer === 'observed') {
      for (const c of observed) {
        if (c.dow >= 0 && c.dow < 7 && c.hour >= 0 && c.hour < 24) {
          g[c.dow][c.hour] = c.battles
          if (c.battles > max) max = c.battles
        }
      }
    } else {
      for (const c of editorial) {
        if (c.dow >= 0 && c.dow < 7 && c.hour >= 0 && c.hour < 24) {
          g[c.dow][c.hour] = c.weight
          if (c.weight > max) max = c.weight
        }
      }
    }

    return { grid: g, maxVal: max }
  }, [layer, observed, editorial])

  const peakLine = useMemo(() => computePeak(observed), [observed])

  if (!metrics) return null

  const sageBase = '62,107,74'
  const amberBase = '192,120,24'

  return (
    <section style={{ marginBottom: 32 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={sectionTitle}>Battle timing</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <LayerToggle
            label="Observed"
            active={layer === 'observed'}
            disabled={observedEmpty}
            disabledTitle="No observed battle data"
            color={`rgb(${sageBase})`}
            onClick={() => setLayer('observed')}
          />
          <LayerToggle
            label="Editorial priors"
            active={layer === 'editorial'}
            disabled={editorialEmpty}
            disabledTitle="No editorial priors configured"
            color={`rgb(${amberBase})`}
            onClick={() => setLayer('editorial')}
          />
        </div>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--ink-30)' }}>
        Days run Sunday → Saturday (dow 0 = Sunday, Postgres EXTRACT(dow)).
      </p>

      {observedEmpty && layer === 'editorial' && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-50)' }}>
          No battles yet — priors only
        </p>
      )}

      {peakLine && layer === 'observed' && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-50)', fontWeight: 500 }}>
          {peakLine}
        </p>
      )}

      {(layer === 'observed' && observedEmpty) ||
      (layer === 'editorial' && editorialEmpty) ? (
        <div style={emptyBox}>
          {layer === 'observed'
            ? 'No observed battle timing data.'
            : 'No editorial time priors for this group.'}
        </div>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            padding: '4px 0',
          }}
        >
          <div style={{ display: 'flex', gap: 4, minWidth: 640 }}>
            <div style={{ width: 36, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(24, 1fr)',
                  gap: 2,
                  marginBottom: 4,
                }}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    style={{
                      fontSize: 9,
                      color: 'var(--ink-30)',
                      textAlign: 'center',
                      visibility: h % 6 === 0 ? 'visible' : 'hidden',
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {grid.map((row, dow) => (
                <div
                  key={dow}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      flexShrink: 0,
                      fontSize: 11,
                      color: 'var(--ink-50)',
                      textAlign: 'right',
                      paddingRight: 4,
                    }}
                  >
                    {DOW_LABELS[dow]}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(24, 1fr)',
                      gap: 2,
                      flex: 1,
                    }}
                  >
                    {row.map((val, hour) => {
                      const intensity = maxVal > 0 ? val / maxVal : 0
                      const rgb = layer === 'observed' ? sageBase : amberBase
                      const alpha = val > 0 ? 0.12 + intensity * 0.72 : 0.04
                      return (
                        <div
                          key={hour}
                          title={`${DOW_LABELS[dow]} ${hour}:00 — ${val}`}
                          style={{
                            aspectRatio: '1',
                            borderRadius: 2,
                            background: `rgba(${rgb},${alpha})`,
                            border: '1px solid var(--ink-10)',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function LayerToggle({
  label,
  active,
  disabled,
  disabledTitle,
  color,
  onClick,
}: {
  label: string
  active: boolean
  disabled: boolean
  disabledTitle: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? disabledTitle : undefined}
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        border: active ? `1px solid ${color}` : '1px solid var(--ink-10)',
        background: active ? `color-mix(in srgb, ${color} 12%, transparent)` : 'var(--white)',
        color: disabled ? 'var(--ink-30)' : active ? color : 'var(--ink-50)',
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {label}
    </button>
  )
}

const sectionTitle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
}

const emptyBox: CSSProperties = {
  padding: 24,
  borderRadius: 12,
  border: '1px solid var(--ink-10)',
  background: 'var(--white)',
  fontSize: 14,
  color: 'var(--ink-30)',
  textAlign: 'center',
}
