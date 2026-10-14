import type { CSSProperties } from 'react'
import Link from 'next/link'
import type { CompareGroupListItem } from '@/lib/compareGroups.shared'

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

const td: CSSProperties = {
  padding: '12px',
  fontSize: 14,
  verticalAlign: 'top',
}

export function CompareGroupRow({ g }: { g: CompareGroupListItem }) {
  const peakLabel = formatPeakHours(Array.isArray(g.peak_hours) ? g.peak_hours : null)
  return (
    <tr
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
            background: 'var(--surface)',
            color: 'var(--ink-50)',
          }}
        >
          {g.strategy ?? '—'}
        </span>
      </td>
    </tr>
  )
}
