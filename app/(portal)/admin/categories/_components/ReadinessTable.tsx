'use client'

import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  compareGroupBattlesCaption,
  countByStatus,
  intelligenceL2Href,
  intelligenceL3Href,
  isHideableEmpty,
  readinessL3Href,
  relativeTime,
  studyBattlesCaption,
  type ReadinessRow,
  type ReadinessStatus,
} from '@/lib/categoryReadiness.shared'
import { readinessPreviewHref, overviewPreviewHref } from '@/lib/categoryReport/href'

type SortKey = 'raters' | 'battles' | 'products'

const STATUS_STYLE: Record<
  ReadinessStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  empty: {
    label: 'Empty',
    color: 'var(--ink-30)',
    bg: 'var(--surface-1)',
    border: 'var(--ink-10)',
  },
  building: {
    label: 'Building',
    color: 'var(--ink-50)',
    bg: 'var(--white)',
    border: 'var(--ink-10)',
  },
  approaching: {
    label: 'Approaching',
    color: 'var(--amber, #C07818)',
    bg: 'var(--amber-pale, #FAEEDA)',
    border: 'rgba(192,120,24,0.25)',
  },
  sellable: {
    label: 'Sellable',
    color: 'var(--sage, #3E6B4A)',
    bg: 'var(--sage-pale, #eef5f0)',
    border: 'rgba(62,107,74,0.28)',
  },
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

function fmt(n: number): string {
  return n.toLocaleString()
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status as ReadinessStatus]
  if (!style) {
    return (
      <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{status}</span>
    )
  }
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
        padding: '2px 8px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  )
}

function RaterProgress({ row }: { row: ReadinessRow }) {
  const threshold = row.raterThreshold
  const pct =
    threshold > 0 ? Math.min(100, (row.distinctRaters / threshold) * 100) : 0
  const fill =
    row.status === 'sellable'
      ? 'var(--sage, #3E6B4A)'
      : row.status === 'approaching'
        ? 'var(--amber, #C07818)'
        : 'var(--ink-30)'

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      >
        {fmt(row.distinctRaters)}
        <span style={{ fontWeight: 400, color: 'var(--ink-30)' }}>
          {' '}
          / {fmt(threshold)}
        </span>
      </div>
      <div
        style={{
          marginTop: 5,
          height: 4,
          borderRadius: 99,
          background: 'var(--ink-10)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: fill,
            opacity: row.distinctRaters === 0 ? 0 : 1,
          }}
        />
      </div>
    </div>
  )
}

type Props = {
  rows: ReadinessRow[]
  hideEmptyDefault: boolean
} & ({ level: 'l2' } | { level: 'l3'; parentL2Name: string })

function rowHrefFor(level: 'l2' | 'l3', row: ReadinessRow): string | null {
  return level === 'l2' ? readinessL3Href(row.nodeId) : null
}

function rankingsHrefFor(
  level: 'l2' | 'l3',
  parentL2Name: string | undefined,
  row: ReadinessRow
): string {
  if (level === 'l3') return intelligenceL3Href(parentL2Name ?? '', row.name)
  return intelligenceL2Href(row.name)
}

export default function ReadinessTable(props: Props) {
  const { rows, hideEmptyDefault, level } = props
  const parentL2Name = level === 'l3' ? props.parentL2Name : undefined
  const nameHeader = level === 'l2' ? 'L2' : 'L3'
  const showL1 = level === 'l2'
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('raters')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [hideEmpty, setHideEmpty] = useState(hideEmptyDefault)

  const statusCounts = useMemo(() => countByStatus(rows), [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = rows.filter((row) => {
      if (hideEmpty && isHideableEmpty(row)) return false
      if (!q) return true
      const hay = `${row.l1Name ?? ''} ${row.name}`.toLowerCase()
      return hay.includes(q)
    })
    list = [...list].sort((a, b) => {
      const av =
        sortKey === 'raters'
          ? a.distinctRaters
          : sortKey === 'battles'
            ? a.battles
            : a.productsBattled
      const bv =
        sortKey === 'raters'
          ? b.distinctRaters
          : sortKey === 'battles'
            ? b.battles
            : b.productsBattled
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return list
  }, [rows, query, hideEmpty, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
      return
    }
    setSortKey(key)
    setSortDir('desc')
  }

  const th = (key: SortKey, label: string): CSSProperties => ({
    padding: '8px 12px',
    fontSize: 10,
    fontWeight: 500,
    color: 'var(--ink-30)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'right',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    background: sortKey === key ? 'var(--surface-1)' : 'transparent',
  })

  const staticTh: CSSProperties = {
    padding: '8px 12px',
    fontSize: 10,
    fontWeight: 500,
    color: 'var(--ink-30)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  }

  const td: CSSProperties = {
    padding: '11px 12px',
    fontSize: 13,
    color: 'var(--ink)',
    verticalAlign: 'middle',
    fontVariantNumeric: 'tabular-nums',
  }

  function handleRowClick(row: ReadinessRow) {
    const href = rowHrefFor(level, row)
    if (href) router.push(href)
  }

  function stop(e: MouseEvent) {
    e.stopPropagation()
  }

  const hiddenEmptyCount = rows.filter((r) => isHideableEmpty(r)).length

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {(
          [
            ['sellable', 'Sellable'],
            ['approaching', 'Approaching'],
            ['building', 'Building'],
            ['empty', 'Empty'],
          ] as const
        ).map(([key, label]) => (
          <div
            key={key}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: STATUS_STYLE[key].color,
                marginBottom: 6,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {statusCounts[key]}
            </div>
          </div>
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
        <span style={{ fontSize: 12, color: 'var(--ink-30)', marginRight: 4 }}>
          Sort
        </span>
        {(
          [
            ['raters', 'Most raters'],
            ['battles', 'Most battles'],
            ['products', 'Most products'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setSortKey(key)
              setSortDir('desc')
            }}
            style={chipStyle(sortKey === key && sortDir === 'desc')}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setHideEmpty((v) => !v)}
          style={chipStyle(hideEmpty)}
        >
          Hide empty
        </button>
      </div>

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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={showL1 ? 'Search categories…' : 'Search sub-categories…'}
          style={{
            flex: '1 1 240px',
            maxWidth: 360,
            padding: '9px 12px',
            borderRadius: 6,
            border: '1px solid var(--ink-10)',
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            boxSizing: 'border-box',
            background: 'var(--white)',
            color: 'var(--ink)',
          }}
        />
        <span style={{ fontSize: 13, color: 'var(--ink-30)' }}>
          Showing {filtered.length} of {rows.length}
          {hideEmpty && hiddenEmptyCount > 0 ? ` · ${hiddenEmptyCount} empty hidden` : ''}
        </span>
      </div>

      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 12,
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--ink-10)' }}>
              {showL1 && <th style={staticTh}>L1</th>}
              <th style={staticTh}>{nameHeader}</th>
              <th
                style={th('raters', 'Raters')}
                onClick={() => toggleSort('raters')}
              >
                Raters{sortKey === 'raters' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </th>
              <th
                style={th('battles', 'Battles')}
                onClick={() => toggleSort('battles')}
              >
                Battles{sortKey === 'battles' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </th>
              <th
                style={th('products', 'Products')}
                onClick={() => toggleSort('products')}
              >
                Products{sortKey === 'products' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </th>
              <th style={{ ...staticTh, textAlign: 'right' }}>7d / 30d</th>
              <th style={{ ...staticTh, textAlign: 'right' }}>Last battle</th>
              <th style={{ ...staticTh, textAlign: 'right' }}>Status</th>
              <th style={staticTh} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={showL1 ? 9 : 8}
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--ink-30)',
                    fontSize: 14,
                    lineHeight: 1.55,
                  }}
                >
                  {rows.length === 0
                    ? 'No categories returned.'
                    : 'No categories match these filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const href = rowHrefFor(level, row)
                const muted = row.status === 'empty'
                const studyLine = studyBattlesCaption(row.studyBattlesExcluded)
                const compareLine = compareGroupBattlesCaption(row.compareGroupBattles)
                return (
                  <tr
                    key={row.nodeId}
                    onClick={() => handleRowClick(row)}
                    style={{
                      borderTop: '1px solid var(--ink-10)',
                      cursor: href ? 'pointer' : 'default',
                      opacity: muted ? 0.55 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (href) e.currentTarget.style.background = 'var(--surface-1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {showL1 && (
                      <td style={{ ...td, color: 'var(--ink-50)', fontSize: 12 }}>
                        {row.l1Name ?? '—'}
                      </td>
                    )}
                    <td style={td}>
                      <div style={{ fontWeight: 500 }}>{row.name}</div>
                      {studyLine && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--ink-30)',
                            marginTop: 2,
                          }}
                        >
                          {studyLine}
                        </div>
                      )}
                      {compareLine && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--ink-30)',
                            marginTop: 2,
                          }}
                        >
                          {compareLine}
                        </div>
                      )}
                    </td>
                    <td style={{ ...td, minWidth: 110 }}>
                      <RaterProgress row={row} />
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: row.battles ? 'var(--ink)' : 'var(--ink-30)' }}>
                      {row.battles ? fmt(row.battles) : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: row.productsBattled ? 'var(--ink)' : 'var(--ink-30)' }}>
                      {row.productsBattled ? fmt(row.productsBattled) : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)', fontSize: 12 }}>
                      {fmt(row.raters7d)} / {fmt(row.raters30d)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--ink-50)', fontSize: 12 }}>
                      {relativeTime(row.lastBattleAt) || '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <StatusBadge status={row.status} />
                    </td>
                    <td style={td} onClick={stop}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <Link
                          href={overviewPreviewHref(level, row.nodeId)}
                          style={{
                            fontSize: 12,
                            color: 'var(--sage, #3E6B4A)',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                          }}
                        >
                          Preview Overview
                        </Link>
                        <Link
                          href={readinessPreviewHref(level, row.nodeId)}
                          style={{
                            fontSize: 12,
                            color: 'var(--ink-50)',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Admin instrument
                        </Link>
                        <Link
                          href={rankingsHrefFor(level, parentL2Name, row)}
                          style={{
                            fontSize: 11,
                            color: 'var(--ink-30)',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Legacy rankings
                        </Link>
                      </div>
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
