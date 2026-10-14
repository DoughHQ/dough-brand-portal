import type { CSSProperties } from 'react'
import type { SortKey } from './ReadinessSortBar'

export function ReadinessTableHead({
  showL1,
  nameHeader,
  sortKey,
  sortDir,
  toggleSort,
}: {
  showL1: boolean
  nameHeader: string
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  toggleSort: (key: SortKey) => void
}) {
  const th = (key: SortKey): CSSProperties => ({
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

  return (
    <thead>
      <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--ink-10)' }}>
        {showL1 && <th style={staticTh}>L1</th>}
        <th style={staticTh}>{nameHeader}</th>
        <th
          style={th('raters')}
          onClick={() => toggleSort('raters')}
        >
          Raters{sortKey === 'raters' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
        </th>
        <th
          style={th('battles')}
          onClick={() => toggleSort('battles')}
        >
          Battles{sortKey === 'battles' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
        </th>
        <th
          style={th('products')}
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
  )
}
