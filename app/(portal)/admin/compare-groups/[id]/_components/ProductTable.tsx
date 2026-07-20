'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { CompareGroupMetrics } from '@/lib/compareGroups.shared'
import { fmtPct, sageTint } from './groupHelpers'

type SortKey = 'product' | 'node' | 'battles' | 'wins' | 'losses' | 'win_rate' | 'elo'

type Props = {
  metrics: CompareGroupMetrics | null
}

export default function ProductTable({ metrics }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('win_rate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const nodeColorMap = useMemo(() => {
    const map = new Map<number, string>()
    if (metrics?.per_node) {
      for (const n of metrics.per_node) {
        if (n.node_id != null) {
          map.set(n.node_id, sageTint(n.node_win_rate))
        }
      }
    }
    return map
  }, [metrics])

  const rows = useMemo(() => {
    const list = metrics?.per_product ?? []
    const sorted = [...list].sort((a, b) => {
      let av: string | number | null = 0
      let bv: string | number | null = 0
      switch (sortKey) {
        case 'product':
          av = (a.product_name ?? '').toLowerCase()
          bv = (b.product_name ?? '').toLowerCase()
          break
        case 'node':
          av = (a.node_name ?? '').toLowerCase()
          bv = (b.node_name ?? '').toLowerCase()
          break
        case 'battles':
          av = a.battles
          bv = b.battles
          break
        case 'wins':
          av = a.wins
          bv = b.wins
          break
        case 'losses':
          av = a.losses
          bv = b.losses
          break
        case 'win_rate':
          av = a.win_rate ?? -1
          bv = b.win_rate ?? -1
          break
        case 'elo':
          av = a.avg_elo_before ?? -1
          bv = b.avg_elo_before ?? -1
          break
      }
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [metrics, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'product' || key === 'node' ? 'asc' : 'desc')
    }
  }

  const th = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => (
    <th
      style={{ ...staticTh, textAlign: align, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => toggleSort(key)}
    >
      {label}
      {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  )

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={sectionTitle}>Products</div>

      {!metrics || rows.length === 0 ? (
        <div style={emptyBox}>No products have battled in this group yet.</div>
      ) : (
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {th('product', 'Product')}
                {th('node', 'Node')}
                {th('battles', 'Battles', 'right')}
                {th('wins', 'Wins', 'right')}
                {th('losses', 'Losses', 'right')}
                {th('win_rate', 'Win rate', 'right')}
                {th('elo', 'Avg ELO before', 'right')}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.product_id} style={{ borderTop: '1px solid var(--ink-10)' }}>
                  <td style={td}>
                    <Link
                      href={`/products/${p.product_id}`}
                      style={{
                        fontWeight: 500,
                        color: 'var(--sage)',
                        textDecoration: 'none',
                      }}
                    >
                      {p.product_name ?? `Product ${p.product_id}`}
                    </Link>
                  </td>
                  <td style={td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {p.node_id != null && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background:
                              nodeColorMap.get(p.node_id) ?? 'var(--ink-10)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span style={{ color: 'var(--ink-50)', fontSize: 13 }}>
                        {p.node_name ?? '—'}
                      </span>
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)' }}>
                    {p.battles}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)' }}>
                    {p.wins}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)' }}>
                    {p.losses}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        justifyContent: 'flex-end',
                        minWidth: 100,
                      }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtPct(p.win_rate)}
                      </span>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 48,
                          height: 4,
                          borderRadius: 2,
                          background: 'var(--ink-10)',
                          overflow: 'hidden',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            height: '100%',
                            width: `${Math.round((p.win_rate ?? 0) * 100)}%`,
                            background: 'var(--sage)',
                            borderRadius: 2,
                          }}
                        />
                      </span>
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)' }}>
                    {p.avg_elo_before != null ? Math.round(p.avg_elo_before * 10) / 10 : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const sectionTitle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 12,
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

const staticTh: CSSProperties = {
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  borderBottom: '1px solid var(--ink-10)',
}

const td: CSSProperties = {
  padding: '12px',
  fontSize: 14,
  verticalAlign: 'middle',
}
