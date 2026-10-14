import type { CSSProperties, MouseEvent } from 'react'
import Link from 'next/link'
import {
  compareGroupBattlesCaption,
  intelligenceL2Href,
  intelligenceL3Href,
  relativeTime,
  studyBattlesCaption,
  type ReadinessRow,
} from '@/lib/categoryReadiness.shared'
import { overviewPreviewHref, readinessPreviewHref } from '@/lib/categoryReport/href'
import { fmt, RaterProgress } from './RaterProgress'
import { StatusBadge } from './StatusBadge'

function rankingsHrefFor(
  level: 'l2' | 'l3',
  parentL2Name: string | undefined,
  row: ReadinessRow
): string {
  if (level === 'l3') return intelligenceL3Href(parentL2Name ?? '', row.name)
  return intelligenceL2Href(row.name)
}

export function ReadinessTableRow({
  row,
  href,
  showL1,
  level,
  parentL2Name,
  td,
  handleRowClick,
  stop,
}: {
  row: ReadinessRow
  href: string | null
  showL1: boolean
  level: 'l2' | 'l3'
  parentL2Name: string | undefined
  td: CSSProperties
  handleRowClick: (row: ReadinessRow) => void
  stop: (e: MouseEvent) => void
}) {
  const muted = row.status === 'empty'
  const studyLine = studyBattlesCaption(row.studyBattlesExcluded)
  const compareLine = compareGroupBattlesCaption(row.compareGroupBattles)
  return (
    <tr
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
}
