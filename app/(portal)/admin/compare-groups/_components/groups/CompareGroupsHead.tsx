import type { CSSProperties } from 'react'
import type { SortKey } from './compareGroupChrome'

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

export function CompareGroupsHead({
  sortKey,
  sortDir,
  toggleSort,
}: {
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  toggleSort: (key: SortKey) => void
}) {
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

  return (
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
  )
}
