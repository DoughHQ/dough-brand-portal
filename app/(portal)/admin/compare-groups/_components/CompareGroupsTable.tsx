'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type {
  CompareGroupListItem,
  CompareGroupPeakBucket,
} from '@/lib/compareGroups.shared'

type SortKey = 'name' | 'battles' | 'products' | 'respondents'
type SortPreset = 'name' | 'respondents' | 'battles'
type TodFilter = 'any' | CompareGroupPeakBucket | 'none'

const TOD_OPTIONS: { value: TodFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'late', label: 'Late night' },
  { value: 'none', label: 'No priors' },
]

const BATTLE_OPTS = [
  { value: 0, label: 'Any battles' },
  { value: 1, label: '≥1 battle' },
  { value: 10, label: '≥10 battles' },
  { value: 50, label: '≥50 battles' },
]

const RESPONDENT_OPTS = [
  { value: 0, label: 'Any respondents' },
  { value: 1, label: '≥1 respondent' },
  { value: 5, label: '≥5 respondents' },
  { value: 10, label: '≥10 respondents' },
]

function fmtCount(n: number | null | undefined): string {
  if (n == null || n === 0) return '0'
  return String(n)
}

function formatPeakHours(hours: number[] | null | undefined): string | null {
  if (!hours || hours.length === 0) return null
  const sorted = [...hours].sort((a, b) => a - b)
  const fmt = (h: number) => {
    const ampm = h >= 12 ? 'pm' : 'am'
    const hr = h % 12 === 0 ? 12 : h % 12
    return `${hr}${ampm}`
  }
  if (sorted.length === 1) return fmt(sorted[0])
  return `${fmt(sorted[0])}–${fmt(sorted[sorted.length - 1])}`
}

function chipStyle(active: boolean): CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 999,
    border: active ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
    background: active ? 'var(--sage-pale, #eef5f0)' : 'var(--white)',
    color: active ? 'var(--sage)' : 'var(--ink-50)',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  }
}

export default function CompareGroupsTable({
  groups,
}: {
  groups: CompareGroupListItem[]
}) {
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [minBattles, setMinBattles] = useState(0)
  const [minRespondents, setMinRespondents] = useState(0)
  const [tod, setTod] = useState<TodFilter>('any')

  const hasTodData = useMemo(
    () => groups.some((g) => g.peak_bucket != null || g.has_time_priors),
    [groups]
  )

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    let list = groups

    if (q) {
      list = list.filter(
        (g) =>
          (g.name ?? '').toLowerCase().includes(q) ||
          (g.consumer_question ?? '').toLowerCase().includes(q) ||
          (g.code ?? '').toLowerCase().includes(q)
      )
    }
    if (minBattles > 0) {
      list = list.filter((g) => (g.battle_count ?? 0) >= minBattles)
    }
    if (minRespondents > 0) {
      list = list.filter((g) => (g.respondent_count ?? 0) >= minRespondents)
    }
    if (tod === 'none') {
      list = list.filter((g) => !g.has_time_priors && !g.peak_bucket)
    } else if (tod !== 'any') {
      list = list.filter((g) => g.peak_bucket === tod)
    }

    const sorted = [...list].sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0
      if (sortKey === 'name') {
        av = (a.name ?? '').toLowerCase()
        bv = (b.name ?? '').toLowerCase()
      } else if (sortKey === 'battles') {
        av = a.battle_count ?? 0
        bv = b.battle_count ?? 0
      } else if (sortKey === 'products') {
        av = a.product_count ?? 0
        bv = b.product_count ?? 0
      } else {
        av = a.respondent_count ?? 0
        bv = b.respondent_count ?? 0
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [groups, filter, sortKey, sortDir, minBattles, minRespondents, tod])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  function applyPreset(preset: SortPreset) {
    if (preset === 'name') {
      setSortKey('name')
      setSortDir('asc')
      return
    }
    setSortKey(preset)
    setSortDir('desc')
  }

  const th = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => (
    <th
      style={{
        textAlign: align,
        padding: '10px 12px',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-30)',
        borderBottom: '1px solid var(--ink-10)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => toggleSort(key)}
    >
      {label}
      {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  )

  const activePreset: SortPreset | null =
    sortKey === 'name' && sortDir === 'asc'
      ? 'name'
      : sortKey === 'respondents' && sortDir === 'desc'
        ? 'respondents'
        : sortKey === 'battles' && sortDir === 'desc'
          ? 'battles'
          : null

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={filterLabel}>Sort</span>
        <button
          type="button"
          onClick={() => applyPreset('respondents')}
          style={chipStyle(activePreset === 'respondents')}
        >
          Most respondents
        </button>
        <button
          type="button"
          onClick={() => applyPreset('battles')}
          style={chipStyle(activePreset === 'battles')}
        >
          Most battles
        </button>
        <button
          type="button"
          onClick={() => applyPreset('name')}
          style={chipStyle(activePreset === 'name')}
        >
          Name A–Z
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={filterLabel}>Battles</span>
        {BATTLE_OPTS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setMinBattles(o.value)}
            style={chipStyle(minBattles === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={filterLabel}>Respondents</span>
        {RESPONDENT_OPTS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setMinRespondents(o.value)}
            style={chipStyle(minRespondents === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={filterLabel}>Time of day</span>
        {TOD_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            title={
              !hasTodData && o.value !== 'any'
                ? 'Apply the list_compare_groups peak-TOD migration to enable this filter'
                : undefined
            }
            disabled={!hasTodData && o.value !== 'any'}
            onClick={() => setTod(o.value)}
            style={{
              ...chipStyle(tod === o.value),
              opacity: !hasTodData && o.value !== 'any' ? 0.45 : 1,
              cursor: !hasTodData && o.value !== 'any' ? 'not-allowed' : 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {!hasTodData && (
        <p style={{ fontSize: 12, color: 'var(--ink-30)', margin: '0 0 12px' }}>
          Time-of-day filters need the updated list RPC (peak buckets from editorial
          priors). Until that migration is applied, only name/battle/respondent filters
          work.
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or question…"
          style={{
            flex: '1 1 240px',
            maxWidth: 360,
            padding: '9px 12px',
            borderRadius: 6,
            border: '1px solid var(--ink-10)',
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            boxSizing: 'border-box',
          }}
        />
        <span style={{ fontSize: 13, color: 'var(--ink-30)' }}>
          Showing {rows.length} of {groups.length}
        </span>
      </div>

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
              {th('name', 'Name')}
              <th style={staticTh}>Question</th>
              <th style={{ ...staticTh, textAlign: 'right' }}>Nodes</th>
              {th('battles', 'Battles', 'right')}
              {th('products', 'Products', 'right')}
              {th('respondents', 'Respondents', 'right')}
              <th style={staticTh}>Status</th>
              <th style={staticTh}>Strategy</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 32,
                    textAlign: 'center',
                    color: 'var(--ink-30)',
                    fontSize: 14,
                  }}
                >
                  No compare groups match these filters.
                </td>
              </tr>
            ) : (
              rows.map((g) => {
                const peakLabel = formatPeakHours(
                  Array.isArray(g.peak_hours) ? g.peak_hours : null
                )
                return (
                  <tr
                    key={g.compare_group_id}
                    style={{ borderTop: '1px solid var(--ink-10)' }}
                  >
                    <td style={td}>
                      <Link
                        href={`/admin/compare-groups/${g.compare_group_id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          display: 'block',
                        }}
                      >
                        <div style={{ fontWeight: 500, color: 'var(--ink)' }}>
                          {g.name ?? 'Untitled'}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--ink-30)',
                            marginTop: 2,
                          }}
                        >
                          {g.code ?? ''}
                          {peakLabel
                            ? `${g.code ? ' · ' : ''}${peakLabel}${
                                g.peak_bucket ? ` (${g.peak_bucket})` : ''
                              }`
                            : ''}
                        </div>
                      </Link>
                    </td>
                    <td style={{ ...td, maxWidth: 280 }}>
                      <Link
                        href={`/admin/compare-groups/${g.compare_group_id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'var(--ink-50)',
                          fontSize: 13,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {g.consumer_question?.trim() || '—'}
                      </Link>
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)' }}>
                      {fmtCount(g.node_count)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)' }}>
                      {fmtCount(g.battle_count)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)' }}>
                      {fmtCount(g.product_count)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)' }}>
                      {fmtCount(g.respondent_count)}
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background:
                            g.status === 'active'
                              ? 'rgba(62,107,74,0.12)'
                              : 'rgba(28,38,32,0.08)',
                          color:
                            g.status === 'active' ? 'var(--sage)' : 'var(--ink-50)',
                        }}
                      >
                        {g.status ?? '—'}
                      </span>
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'var(--cream, #FAF8F3)',
                          color: 'var(--ink-50)',
                        }}
                      >
                        {g.strategy ?? '—'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const filterLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginRight: 4,
}

const staticTh: CSSProperties = {
  textAlign: 'left',
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
  verticalAlign: 'top',
}
