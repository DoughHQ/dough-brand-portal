'use client'

import { useRouter } from 'next/navigation'
import type { CSSProperties, MouseEvent } from 'react'
import { readinessL3Href, type ReadinessRow } from '@/lib/categoryReadiness.shared'
import type { SortKey } from './ReadinessSortBar'
import { ReadinessTableHead } from './ReadinessTableHead'
import { ReadinessTableRow } from './ReadinessTableRow'

function rowHrefFor(level: 'l2' | 'l3', row: ReadinessRow): string | null {
  return level === 'l2' ? readinessL3Href(row.nodeId) : null
}

export function ReadinessTableBody({
  showL1,
  nameHeader,
  sortKey,
  sortDir,
  toggleSort,
  filtered,
  rows,
  level,
  parentL2Name,
}: {
  showL1: boolean
  nameHeader: string
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  toggleSort: (key: SortKey) => void
  filtered: ReadinessRow[]
  rows: ReadinessRow[]
  level: 'l2' | 'l3'
  parentL2Name: string | undefined
}) {
  const router = useRouter()

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

  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        overflow: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
        <ReadinessTableHead
          showL1={showL1}
          nameHeader={nameHeader}
          sortKey={sortKey}
          sortDir={sortDir}
          toggleSort={toggleSort}
        />
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
            filtered.map((row) => (
              <ReadinessTableRow
                key={row.nodeId}
                row={row}
                href={rowHrefFor(level, row)}
                showL1={showL1}
                level={level}
                parentL2Name={parentL2Name}
                td={td}
                handleRowClick={handleRowClick}
                stop={stop}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
