'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { SelectedNode } from '@/lib/compareGroups.shared'
import {
  listL2ParentsAction,
  listL3ChildrenAction,
  resolveL2LabelsAction,
  searchTaxonomyForPickerAction,
} from '../actions'
import type { TaxonomyL2Parent, TaxonomyL3Child, TaxonomySearchHit } from '@/lib/taxonomy'

type Props = {
  value: SelectedNode[]
  onChange: (next: SelectedNode[]) => void
}

export default function TaxonomyMultiSelect({ value, onChange }: Props) {
  const [l2Parents, setL2Parents] = useState<TaxonomyL2Parent[]>([])
  const [selectedL2, setSelectedL2] = useState<number | ''>('')
  const [l3Children, setL3Children] = useState<TaxonomyL3Child[]>([])
  const [l3Loading, setL3Loading] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<TaxonomySearchHit[]>([])
  const [searching, setSearching] = useState(false)

  const selectedIds = useMemo(
    () => new Set(value.map((n) => n.taxonomy_node_id)),
    [value]
  )

  useEffect(() => {
    void listL2ParentsAction().then(setL2Parents)
  }, [])

  useEffect(() => {
    if (selectedL2 === '') {
      setL3Children([])
      return
    }
    let cancelled = false
    setL3Loading(true)
    void listL3ChildrenAction(selectedL2).then((rows) => {
      if (!cancelled) {
        setL3Children(rows)
        setL3Loading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [selectedL2])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 1) {
      setHits([])
      return
    }
    const t = window.setTimeout(() => {
      setSearching(true)
      void searchTaxonomyForPickerAction(q).then((rows) => {
        setHits(rows)
        setSearching(false)
      })
    }, 200)
    return () => window.clearTimeout(t)
  }, [query])

  function removeNode(id: number) {
    onChange(value.filter((n) => n.taxonomy_node_id !== id))
  }

  function toggleL3(child: TaxonomyL3Child) {
    const id = child.taxonomy_node_id
    if (selectedIds.has(id)) {
      removeNode(id)
      return
    }
    onChange([
      ...value,
      {
        taxonomy_node_id: id,
        node_name_display: child.node_name_display ?? `Node ${id}`,
        path_names_csv: child.path_names_csv ?? '',
        l2_node_name: child.l2_node_name ?? '',
      },
    ])
  }

  async function addSearchHit(hit: TaxonomySearchHit) {
    const id = hit.taxonomy_node_id
    if (selectedIds.has(id)) return
    const provisional: SelectedNode = {
      taxonomy_node_id: id,
      node_name_display: hit.node_name_display ?? `Node ${id}`,
      path_names_csv: hit.path_names_csv ?? '',
      l2_node_name: '…',
    }
    const next = [...value, provisional]
    onChange(next)
    setQuery('')
    setHits([])
    const labels = await resolveL2LabelsAction([id])
    const l2 = labels[0]?.l2_node_name ?? ''
    onChange(
      next.map((n) =>
        n.taxonomy_node_id === id ? { ...n, l2_node_name: l2 || '' } : n
      )
    )
  }

  const grouped = useMemo(() => {
    const map = new Map<string, SelectedNode[]>()
    for (const n of value) {
      const key =
        !n.l2_node_name || n.l2_node_name === '…' ? 'Ungrouped' : n.l2_node_name
      const list = map.get(key) ?? []
      list.push(n)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 'Ungrouped') return 1
      if (b === 'Ungrouped') return -1
      return a.localeCompare(b)
    })
  }, [value])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={sectionLabel}>Browse by category</div>
        <select
          value={selectedL2}
          onChange={(e) =>
            setSelectedL2(e.target.value ? Number(e.target.value) : '')
          }
          style={inputStyle}
        >
          <option value="">Select an L2 category…</option>
          {l2Parents.map((p) => (
            <option key={p.l2_id} value={p.l2_id}>
              {p.l2_node_name} ({p.l3_count})
            </option>
          ))}
        </select>
        {l3Loading && <div style={{ ...muted, marginTop: 8 }}>Loading…</div>}
        {!l3Loading && l3Children.length > 0 && (
          <div
            style={{
              marginTop: 10,
              maxHeight: 220,
              overflow: 'auto',
              border: '1px solid var(--ink-10)',
              borderRadius: 8,
              padding: '8px 10px',
              background: 'var(--white)',
            }}
          >
            {l3Children.map((c) => (
              <label
                key={c.taxonomy_node_id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '6px 4px',
                  fontSize: 13,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.taxonomy_node_id)}
                  onChange={() => toggleL3(c)}
                  style={{ marginTop: 2 }}
                />
                <span>
                  <span style={{ fontWeight: 500 }}>
                    {c.node_name_display ?? c.taxonomy_node_id}
                  </span>
                  {c.path_names_csv && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'var(--ink-30)',
                        marginTop: 2,
                      }}
                    >
                      {c.path_names_csv.replace(/,/g, ' › ')}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={sectionLabel}>Search nodes</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or path…"
          style={inputStyle}
        />
        {(searching || hits.length > 0) && (
          <div
            style={{
              marginTop: 6,
              border: '1px solid var(--ink-10)',
              borderRadius: 8,
              maxHeight: 200,
              overflow: 'auto',
              background: 'var(--white)',
            }}
          >
            {searching && hits.length === 0 && (
              <div style={{ padding: 10, fontSize: 13, color: 'var(--ink-30)' }}>
                Searching…
              </div>
            )}
            {hits.map((h) => (
              <button
                key={h.taxonomy_node_id}
                type="button"
                disabled={selectedIds.has(h.taxonomy_node_id)}
                onClick={() => void addSearchHit(h)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderBottom: '1px solid var(--ink-10)',
                  padding: '8px 12px',
                  background: 'transparent',
                  cursor: selectedIds.has(h.taxonomy_node_id) ? 'default' : 'pointer',
                  opacity: selectedIds.has(h.taxonomy_node_id) ? 0.45 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                  {h.node_name_display ?? h.taxonomy_node_id}
                </div>
                {h.path_names_csv && (
                  <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
                    {h.path_names_csv.replace(/,/g, ' › ')}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>
          {value.length} node{value.length === 1 ? '' : 's'} selected
        </div>
        {value.length === 0 ? (
          <div style={muted}>No nodes selected yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {grouped.map(([l2, nodes]) => (
              <div key={l2}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--ink-50)',
                    marginBottom: 6,
                  }}
                >
                  {l2}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {nodes.map((n) => (
                    <span
                      key={n.taxonomy_node_id}
                      title={n.path_names_csv.replace(/,/g, ' › ') || undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'var(--cream, #FAF8F3)',
                        border: '1px solid var(--ink-10)',
                        color: 'var(--ink)',
                      }}
                    >
                      {n.node_name_display}
                      <button
                        type="button"
                        onClick={() => removeNode(n.taxonomy_node_id)}
                        aria-label={`Remove ${n.node_name_display}`}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--ink-50)',
                          padding: 0,
                          fontSize: 14,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const sectionLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 6,
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  color: 'var(--ink)',
  background: 'var(--white)',
  boxSizing: 'border-box',
}

const muted: CSSProperties = {
  fontSize: 13,
  color: 'var(--ink-30)',
}
