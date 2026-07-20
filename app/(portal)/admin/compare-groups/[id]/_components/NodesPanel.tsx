'use client'

import { useMemo, type CSSProperties } from 'react'
import type { CompareGroupDetail, CompareGroupMetrics } from '@/lib/compareGroups.shared'
import { fmtPct, sageTint } from './groupHelpers'

type Props = {
  detail: CompareGroupDetail
  metrics: CompareGroupMetrics | null
}

export default function NodesPanel({ detail, metrics }: Props) {
  const perNodeMap = useMemo(() => {
    const map = new Map<number, CompareGroupMetrics['per_node'][number]>()
    if (metrics?.per_node) {
      for (const n of metrics.per_node) {
        if (n.node_id != null) map.set(n.node_id, n)
      }
    }
    return map
  }, [metrics])

  const favoriteId = useMemo(() => {
    if (!metrics?.per_node?.length) return null
    let best: number | null = null
    let bestRate = -1
    for (const n of metrics.per_node) {
      if (n.node_id == null || n.node_battles === 0) continue
      const rate = n.node_win_rate ?? 0
      if (rate > bestRate) {
        bestRate = rate
        best = n.node_id
      }
    }
    return best
  }, [metrics])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof detail.nodes>()
    for (const node of detail.nodes) {
      const key = node.l2_node_name?.trim() || 'Ungrouped'
      const list = map.get(key) ?? []
      list.push(node)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 'Ungrouped') return 1
      if (b === 'Ungrouped') return -1
      return a.localeCompare(b)
    })
  }, [detail.nodes])

  const hasMetrics = metrics != null

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={sectionTitle}>Nodes ({detail.nodes.length})</div>

      {detail.nodes.length === 0 ? (
        <div style={emptyBox}>No nodes in this group.</div>
      ) : (
        <>
          {hasMetrics && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 14,
                fontSize: 12,
                color: 'var(--ink-50)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: sageTint(0.5),
                    border: '1px solid rgba(62,107,74,0.25)',
                  }}
                />
                Win rate tint (deeper = higher)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--sage)', fontSize: 10 }}>▲</span>
                Favorite node
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: 'var(--ink-10)',
                  }}
                />
                No battle data
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {grouped.map(([l2, nodes]) => (
              <div key={l2}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--ink-50)',
                    marginBottom: 8,
                  }}
                >
                  {l2}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {nodes.map((node) => {
                    const stats = perNodeMap.get(node.taxonomy_node_id)
                    const hasData = hasMetrics && stats != null && stats.node_battles > 0
                    const isFavorite = favoriteId === node.taxonomy_node_id
                    const noData = hasMetrics && !hasData

                    return (
                      <div
                        key={node.taxonomy_node_id}
                        title={node.path_names?.replace(/,/g, ' › ') ?? undefined}
                        style={{
                          display: 'inline-flex',
                          flexDirection: 'column',
                          gap: 2,
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: isFavorite
                            ? '1px solid rgba(62,107,74,0.45)'
                            : '1px solid var(--ink-10)',
                          background: noData
                            ? 'rgba(28,38,32,0.04)'
                            : hasData
                              ? sageTint(stats?.node_win_rate, isFavorite ? 1.15 : 1)
                              : 'var(--white)',
                          opacity: noData ? 0.72 : 1,
                          minWidth: 120,
                          maxWidth: 220,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 13,
                            fontWeight: 500,
                            color: noData ? 'var(--ink-50)' : 'var(--ink)',
                          }}
                        >
                          {isFavorite && (
                            <span style={{ color: 'var(--sage)', fontSize: 9, lineHeight: 1 }}>
                              ▲
                            </span>
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {node.node_name ?? `Node ${node.taxonomy_node_id}`}
                          </span>
                        </div>
                        {hasData && stats && (
                          <div style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                            {fmtPct(stats.node_win_rate)} · {stats.node_battles} battles
                          </div>
                        )}
                        {noData && (
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--ink-30)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            no data
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
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
