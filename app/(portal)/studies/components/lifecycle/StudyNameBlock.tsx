import type { ReactNode } from 'react'
import type { OperatorStudyLifecycleState, OperatorStudyRow } from '@/lib/studies/types'
import {
  productMeta,
  showTwoSessionIndicator,
  statusPill,
  typeBadgeLabel,
} from './studyRowModel'

function TypeBadge({ label }: { label: string }) {
  return <span className="studies-type-badge">{label}</span>
}

export function StatusPillView({ state }: { state: OperatorStudyLifecycleState }) {
  const pill = statusPill(state)
  return (
    <span
      className="studies-status-pill"
      style={{ color: pill.color, background: pill.background }}
    >
      {pill.label}
    </span>
  )
}

export function NameBlock({
  row,
  showBrand,
  extraBadges,
}: {
  row: OperatorStudyRow
  showBrand: boolean
  extraBadges?: ReactNode
}) {
  const typeLabel = typeBadgeLabel(row)
  const title =
    row.title || `${typeLabel}${row.brand_name ? ` · ${row.brand_name}` : ''}`
  const sub = [
    productMeta(row),
    showBrand && row.brand_name ? row.brand_name : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div style={{ minWidth: 0 }}>
      <div className="studies-study-name" title={row.title}>
        {title}
      </div>
      <div className="studies-study-meta">
        <TypeBadge label={typeLabel} />
        {showTwoSessionIndicator(row) ? <TypeBadge label="2 sessions" /> : null}
        {extraBadges}
        <span className="studies-study-sub">{sub}</span>
      </div>
    </div>
  )
}
