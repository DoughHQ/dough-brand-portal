'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import type {
  OperatorStudyLifecycleState,
  OperatorStudyRow,
} from '@/lib/studies/types'
import RowOverflowMenu from './RowOverflowMenu'
import {
  ICON_CHECK,
  ICON_CLOCK,
  ICON_FILE,
  ICON_FLASK,
  StudiesGlyph,
} from './studiesIcons'

function studyLabel(missionType: string): string {
  if (missionType === 'concept_test') return 'Concept'
  if (missionType === 'product_discovery') return 'Discovery'
  if (missionType === 'verified_purchase') return 'Verified purchase'
  if (missionType === 'brand_challenge') return 'Challenge'
  return 'Study'
}

function typeBadgeLabel(row: OperatorStudyRow): string {
  if (row.test_type === 'concept') return 'Concept'
  if (row.test_type === 'ihut') return 'iHUT'
  if (!row.mission_type) return 'Study'
  return studyLabel(row.mission_type)
}

function showTwoSessionIndicator(row: OperatorStudyRow): boolean {
  return row.test_type === 'ihut' && row.session_count === 2
}

function productMeta(row: OperatorStudyRow): string {
  if (row.test_type === 'concept' || row.mission_type === 'concept_test') {
    return 'Concept field'
  }
  return row.focal_product_name ?? 'Product pending'
}

function claimProgress(row: OperatorStudyRow): {
  label: string
  ratio: number | null
} {
  const completed =
    typeof row.completed_claims === 'number' && Number.isFinite(row.completed_claims)
      ? row.completed_claims
      : 0
  const target =
    typeof row.target_completions === 'number' && row.target_completions > 0
      ? row.target_completions
      : null
  if (target != null) {
    return {
      label: `${completed} / ${target} participants`,
      ratio: Math.min(1, completed / target),
    }
  }
  if (completed === 0) return { label: 'No responses yet', ratio: null }
  return { label: `${completed} completed`, ratio: null }
}

function reportHref(row: OperatorStudyRow): string {
  if (row.test_type === 'concept' || row.mission_type === 'concept_test') {
    return `/studies/concept/${row.mission_id}/report`
  }
  return `/reports/${row.mission_id}`
}

function statusPill(state: OperatorStudyLifecycleState): {
  label: string
  color: string
  background: string
} {
  switch (state) {
    case 'expired':
      return {
        label: 'Expired',
        color: 'var(--ink-50)',
        background: 'var(--mist, var(--surface-1))',
      }
    case 'archived':
      return {
        label: 'Archived',
        color: 'var(--ink-30)',
        background: 'var(--surface-1)',
      }
    case 'paused':
      return {
        label: 'Paused',
        color: 'var(--amber, #C07818)',
        background: 'var(--amber-pale, #FBF3E8)',
      }
    case 'scheduled':
      return {
        label: 'Scheduled',
        color: 'var(--ink-50)',
        background: 'var(--surface-1)',
      }
    default:
      return {
        label: 'Active',
        color: 'var(--sage-dark)',
        background: 'var(--sage-soft, var(--sage-pale))',
      }
  }
}

function TypeBadge({ label }: { label: string }) {
  return <span className="studies-type-badge">{label}</span>
}

function StatusPillView({ state }: { state: OperatorStudyLifecycleState }) {
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

export function StudiesSectionHead({
  title,
  icon,
}: {
  title: string
  icon: ReactNode
}) {
  return (
    <div className="studies-section-head">
      <span className="studies-section-icon" aria-hidden>
        {icon}
      </span>
      <h2 className="studies-section-title">{title}</h2>
    </div>
  )
}

export function InProgressSectionHead() {
  return (
    <StudiesSectionHead
      title="In progress"
      icon={<StudiesGlyph d={ICON_CLOCK} size={16} />}
    />
  )
}

export function DraftsSectionHead() {
  return (
    <StudiesSectionHead
      title="Drafts"
      icon={<StudiesGlyph d={ICON_FILE} size={16} />}
    />
  )
}

export function CompletedSectionHead() {
  return (
    <StudiesSectionHead
      title="Completed"
      icon={<StudiesGlyph d={ICON_CHECK} size={16} />}
    />
  )
}

export function InProgressEmpty() {
  return (
    <div className="studies-empty-active">
      <div className="studies-empty-active-icon">
        <StudiesGlyph d={ICON_FLASK} size={22} />
      </div>
      <h3 className="studies-empty-active-title">No active studies right now</h3>
      <p className="studies-empty-active-copy">
        Start a new study when you want focused feedback from qualified consumers.
      </p>
      <Link href="/studies/new" className="studies-new-study studies-new-study-sm">
        <span aria-hidden style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>
          +
        </span>
        New study
      </Link>
    </div>
  )
}

type StudyListProps = {
  rows: OperatorStudyRow[]
  canOperate: boolean
  busyId: string | null
  pending: boolean
  showBrand: boolean
  onClose: (row: OperatorStudyRow) => void
  onWithdraw: (row: OperatorStudyRow) => void
}

function rowOverflow(
  row: OperatorStudyRow,
  args: Omit<StudyListProps, 'rows' | 'showBrand'>
) {
  const canClose =
    args.canOperate &&
    (row.lifecycle_state === 'active' ||
      row.lifecycle_state === 'paused' ||
      row.lifecycle_state === 'scheduled')
  return [
    ...(canClose
      ? [
          {
            label: 'Close study',
            disabled: args.busyId === row.mission_id || args.pending,
            onClick: () => args.onClose(row),
          },
        ]
      : []),
    {
      label: 'Withdraw',
      disabled: args.busyId === row.mission_id || args.pending,
      onClick: () => args.onWithdraw(row),
    },
  ]
}

function NameBlock({
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

export function ActiveStudyList({
  rows,
  canOperate,
  busyId,
  pending,
  showBrand,
  onClose,
  onWithdraw,
}: StudyListProps) {
  return (
    <div className="studies-list">
      {rows.map((row) => {
        const progress = claimProgress(row)
        const state = row.lifecycle_state
        const showState = state === 'paused' || state === 'scheduled'
        const overflow = rowOverflow(row, {
          canOperate,
          busyId,
          pending,
          onClose,
          onWithdraw,
        })

        return (
          <div key={row.mission_id} className="studies-study-row studies-study-row--active">
            <div className="studies-study-main">
              <NameBlock
                row={row}
                showBrand={showBrand}
                extraBadges={showState ? <StatusPillView state={state} /> : null}
              />
            </div>
            <div className="studies-study-mid">
              <div
                className="studies-progress-label"
                style={{ marginBottom: progress.ratio != null ? 8 : 0 }}
              >
                {progress.label}
              </div>
              {progress.ratio != null ? (
                <div className="studies-progress-track">
                  <div
                    className="studies-progress-fill"
                    style={{ width: `${Math.round(progress.ratio * 100)}%` }}
                  />
                </div>
              ) : null}
            </div>
            <div className="studies-study-actions">
              <Link href={reportHref(row)} className="studies-row-cta">
                View report →
              </Link>
              {canOperate ? <RowOverflowMenu actions={overflow} /> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CompletedStudyList({
  rows,
  canOperate,
  busyId,
  pending,
  showBrand,
  onClose,
  onWithdraw,
}: StudyListProps) {
  return (
    <div className="studies-list">
      {rows.map((row) => {
        const responses =
          typeof row.completed_claims === 'number' && Number.isFinite(row.completed_claims)
            ? row.completed_claims
            : 0
        const state = row.lifecycle_state
        const showState = state === 'expired' || state === 'archived'
        const overflow = rowOverflow(row, {
          canOperate,
          busyId,
          pending,
          onClose,
          onWithdraw,
        })

        return (
          <div key={row.mission_id} className="studies-study-row studies-study-row--completed">
            <div className="studies-study-main">
              <div className="studies-study-mark">
                <StudiesGlyph d={ICON_CHECK} size={16} />
              </div>
              <NameBlock
                row={row}
                showBrand={showBrand}
                extraBadges={showState ? <StatusPillView state={state} /> : null}
              />
            </div>
            <div className="studies-study-mid">
              <div className="studies-stat-label">Responses</div>
              <div className="studies-stat-value">{responses}</div>
            </div>
            <div className="studies-study-actions">
              <Link href={reportHref(row)} className="studies-row-cta">
                View results →
              </Link>
              {canOperate ? <RowOverflowMenu actions={overflow} /> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
