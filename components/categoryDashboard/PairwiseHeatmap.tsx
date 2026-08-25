'use client'

import { useMemo, useState } from 'react'
import type { CategoryPairwise, PairwisePair, Ranking } from '@/lib/categoryReport/types'

type AxisItem = { id: number; name: string }

function pairKey(a: number, b: number): string {
  return `${a}:${b}`
}

function cellFill(p: number): string {
  const t = Math.max(-1, Math.min(1, (p - 0.5) * 2))
  if (t >= 0) return `rgba(62, 107, 74, ${0.1 + t * 0.62})`
  return `rgba(192, 120, 24, ${0.1 + -t * 0.62})`
}

function groupPairs(pairs: PairwisePair[]): Map<string, PairwisePair[]> {
  const map = new Map<string, PairwisePair[]>()
  for (const pair of pairs) {
    const key = String(pair.component_id)
    const list = map.get(key)
    if (list) list.push(pair)
    else map.set(key, [pair])
  }
  return map
}

function axisFor(
  pairs: PairwisePair[],
  ranking: Ranking | null,
  componentId: string
): AxisItem[] {
  const fromRank = ranking?.components.find((c) => String(c.component_id) === componentId)
  if (fromRank && fromRank.products.length > 0) {
    return fromRank.products.map((p) => ({ id: p.product_id, name: p.name }))
  }
  const seen = new Map<number, string>()
  for (const pair of pairs) {
    if (!seen.has(pair.a_product_id)) seen.set(pair.a_product_id, pair.a_name)
    if (!seen.has(pair.b_product_id)) seen.set(pair.b_product_id, pair.b_name)
  }
  return [...seen.entries()].map(([id, name]) => ({ id, name }))
}

function ComponentGrid({
  componentId,
  pairs,
  ranking,
  primary,
}: {
  componentId: string
  pairs: PairwisePair[]
  ranking: Ranking | null
  primary: boolean
}) {
  const axis = axisFor(pairs, ranking, componentId)
  const lookup = useMemo(() => {
    const m = new Map<string, PairwisePair>()
    for (const pair of pairs) m.set(pairKey(pair.a_product_id, pair.b_product_id), pair)
    return m
  }, [pairs])
  const [hover, setHover] = useState<PairwisePair | null>(null)

  if (axis.length < 2) {
    return (
      <div style={{ fontSize: 13, color: 'var(--ink-50)', padding: '8px 0', marginBottom: 16 }}>
        Component {componentId}: single item — no pairwise grid.
      </div>
    )
  }

  const maxCell = primary ? 36 : 24
  const cell = Math.max(18, Math.min(maxCell, Math.floor((primary ? 520 : 360) / axis.length)))

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink)',
          marginBottom: 8,
        }}
      >
        Component {componentId} · {axis.length} items
        {primary ? ' · primary' : ''}
      </div>
      <div style={{ overflow: 'auto' }}>
        <table
          style={{ borderCollapse: 'collapse', fontSize: 10 }}
          onMouseLeave={() => setHover(null)}
        >
          <thead>
            <tr>
              <th style={{ padding: 0 }} />
              {axis.map((col) => (
                <th
                  key={col.id}
                  title={col.name}
                  style={{
                    width: cell,
                    height: 80,
                    padding: 0,
                    fontWeight: 400,
                    color: 'var(--ink-50)',
                    verticalAlign: 'bottom',
                  }}
                >
                  <div
                    style={{
                      width: cell,
                      transform: 'rotate(-60deg)',
                      transformOrigin: 'bottom left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 88,
                      marginLeft: 6,
                    }}
                  >
                    {col.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {axis.map((row) => (
              <tr key={row.id}>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '0 8px 0 0',
                    fontWeight: 400,
                    color: 'var(--ink-50)',
                    whiteSpace: 'nowrap',
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={row.name}
                >
                  {row.name}
                </th>
                {axis.map((col) => {
                  if (row.id === col.id) {
                    return (
                      <td
                        key={col.id}
                        style={{
                          width: cell,
                          height: cell,
                          background: 'var(--surface-1)',
                          border: '1px solid var(--ink-10)',
                        }}
                      />
                    )
                  }
                  const pair = lookup.get(pairKey(row.id, col.id))
                  const p = pair?.p_a_beats_b ?? null
                  const implied = pair != null && !pair.directly_compared
                  return (
                    <td
                      key={col.id}
                      onMouseEnter={() => setHover(pair ?? null)}
                      title={pair ? `${pair.a_name} vs ${pair.b_name}` : undefined}
                      style={{
                        width: cell,
                        height: cell,
                        padding: 0,
                        background: p == null ? 'var(--white)' : cellFill(p),
                        border: implied
                          ? '1px dashed rgba(36, 61, 44, 0.45)'
                          : '1px solid var(--ink-10)',
                        opacity: pair && !pair.directly_compared ? 0.72 : 1,
                        backgroundImage: implied
                          ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.35) 3px, rgba(255,255,255,0.35) 4px)'
                          : undefined,
                      }}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          minHeight: 40,
          marginTop: 8,
          fontSize: 12,
          color: 'var(--ink-50)',
          lineHeight: 1.45,
        }}
      >
        {hover ? (
          <>
            <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{hover.a_name}</strong>
            {' vs '}
            <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{hover.b_name}</strong>
            {' · '}
            {hover.p_a_beats_b != null ? `P(A beats B) = ${hover.p_a_beats_b}` : 'P unavailable'}
            {' · observed '}
            {hover.observed_a_wins ?? '—'}–{hover.observed_b_wins ?? '—'}
            {hover.observed_n != null ? ` (n=${hover.observed_n})` : ''}
            {hover.directly_compared ? '' : ' · model-implied, never compared'}
          </>
        ) : (
          'Hover a cell for the observed record and model probability.'
        )}
      </div>
    </div>
  )
}

export default function PairwiseHeatmap({
  pairwise,
  ranking,
}: {
  pairwise: CategoryPairwise
  ranking: Ranking | null
}) {
  const groups = groupPairs(pairwise.pairs)
  const primaryId =
    ranking?.primary_component_id != null ? String(ranking.primary_component_id) : null
  const ids = [...groups.keys()].sort((a, b) => {
    if (a === primaryId) return -1
    if (b === primaryId) return 1
    return a.localeCompare(b)
  })

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
        Pairwise probabilities
      </h2>
      {pairwise.note ? (
        <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: '0 0 12px', lineHeight: 1.5 }}>
          {pairwise.note}
        </p>
      ) : null}
      <div
        style={{
          display: 'flex',
          gap: 16,
          fontSize: 11,
          color: 'var(--ink-50)',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              background: 'rgba(62, 107, 74, 0.55)',
              border: '1px solid var(--ink-10)',
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
              background: 'rgba(62, 107, 74, 0.35)',
              border: '1px dashed rgba(36, 61, 44, 0.45)',
              verticalAlign: 'middle',
              marginRight: 6,
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
            }}
          />
          Model-implied (never met)
        </span>
        <span>Colour around 0.5 · sage = row favoured · amber = column favoured</span>
      </div>
      {ids.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--ink-30)' }}>No pairwise rows in this payload.</p>
      ) : (
        ids.map((id) => (
          <ComponentGrid
            key={id}
            componentId={id}
            pairs={groups.get(id) ?? []}
            ranking={ranking}
            primary={id === primaryId}
          />
        ))
      )}
    </section>
  )
}
