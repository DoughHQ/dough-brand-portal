'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
} from 'react'
import type {
  OperatorStudyLifecycleState,
  OperatorStudyRow,
  WithdrawnStudyRow,
} from '@/lib/studies/types'
import {
  hardDeleteMissionAction,
  restoreMissionAction,
  withdrawMissionAction,
} from './missionTrashActions'
import { closeStudyAction } from './closeStudyAction'
import ConfirmDialog from './ConfirmDialog'
import ConceptDraftsPanel from './concept/ConceptDraftsPanel'
import NewStudyMenu from './components/NewStudyMenu'
import StudiesMetricStrip from './components/StudiesMetricStrip'
import RowOverflowMenu from './components/RowOverflowMenu'
import LaunchpadModal from './components/LaunchpadModal'

type StudiesTab = 'active' | 'complete' | 'draft'

const TAB_KEYS: StudiesTab[] = ['active', 'complete', 'draft']

const TAB_LABELS: Record<StudiesTab, string> = {
  active: 'Active',
  complete: 'Complete',
  draft: 'Draft',
}

const COMPLETE_ORDER: Record<string, number> = {
  completed: 0,
  expired: 1,
  archived: 2,
}

const GRID_WITH_STATUS =
  'minmax(220px, 2.2fr) 110px 150px 110px 100px 120px 44px'
const GRID_NO_STATUS =
  'minmax(220px, 2.2fr) 110px 160px 100px 120px 44px'

function studyLabel(missionType: string): string {
  if (missionType === 'concept_test') return 'Concept'
  if (missionType === 'product_discovery') return 'Discovery'
  if (missionType === 'verified_purchase') return 'Verified purchase'
  if (missionType === 'brand_challenge') return 'Challenge'
  return 'Study'
}

function publishedTypeLabel(missionType: string | null | undefined): string {
  if (!missionType) return 'Study'
  return studyLabel(missionType)
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function lifecycleOf(row: OperatorStudyRow): OperatorStudyLifecycleState {
  return row.lifecycle_state
}

function isActiveBucket(state: OperatorStudyLifecycleState): boolean {
  return state === 'active' || state === 'paused' || state === 'scheduled'
}

function isCompleteBucket(state: OperatorStudyLifecycleState): boolean {
  return state === 'completed' || state === 'expired' || state === 'archived'
}

function isDraftBucket(state: OperatorStudyLifecycleState): boolean {
  return state === 'draft'
}

function tabForRow(row: OperatorStudyRow): StudiesTab {
  const state = lifecycleOf(row)
  if (isDraftBucket(state)) return 'draft'
  if (isCompleteBucket(state)) return 'complete'
  return 'active'
}

function parseTab(raw: string | null): StudiesTab {
  if (raw === 'complete' || raw === 'draft' || raw === 'active') return raw
  return 'active'
}

function isMultiBrand(args: {
  studies: OperatorStudyRow[]
  withdrawn: WithdrawnStudyRow[]
}): boolean {
  const ids = new Set<number>()
  for (const row of args.studies) {
    if (row.brand_id != null) ids.add(row.brand_id)
  }
  for (const row of args.withdrawn) {
    if (row.brand_id != null) ids.add(row.brand_id)
  }
  return ids.size > 1
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
      label: `${completed} of ${target}`,
      ratio: Math.min(1, completed / target),
    }
  }
  if (completed === 0) return { label: 'No responses yet', ratio: null }
  return { label: `${completed} completed`, ratio: null }
}

function inFlightEstimate(row: OperatorStudyRow): number {
  return Math.max(0, row.total_claims - row.completed_claims)
}

function statusPill(state: OperatorStudyLifecycleState): {
  label: string
  color: string
  background: string
} {
  switch (state) {
    case 'draft':
      return {
        label: 'Draft',
        color: 'var(--amber, #C07818)',
        background: 'var(--amber-pale, #FBF3E8)',
      }
    case 'completed':
      return {
        label: 'Completed',
        color: 'var(--sage-dark)',
        background: 'var(--sage-soft, var(--sage-pale))',
      }
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

function withdrawnFromStudy(row: OperatorStudyRow): WithdrawnStudyRow {
  return {
    mission_id: row.mission_id,
    title: row.title,
    status: row.status,
    is_draft: lifecycleOf(row) === 'draft',
    brand_id: row.brand_id,
    brand_name: row.brand_name,
    focal_product_id: row.focal_product_id,
    focal_product_name: row.focal_product_name,
    template_code: row.template_code,
    total_claims: row.total_claims,
    completed_claims: row.completed_claims,
    created_at: row.created_at,
    deleted_at: new Date().toISOString(),
  }
}

function draftContinueHref(row: OperatorStudyRow): string {
  const params = new URLSearchParams({ missionId: row.mission_id })
  if (row.brand_id != null) params.set('brandId', String(row.brand_id))
  return `/admin/studies/new?${params.toString()}`
}

function reportHref(row: OperatorStudyRow): string {
  return row.mission_type === 'concept_test'
    ? `/studies/concept/${row.mission_id}/report`
    : `/reports/${row.mission_id}`
}

function sortComplete(a: OperatorStudyRow, b: OperatorStudyRow): number {
  const ao = COMPLETE_ORDER[lifecycleOf(a)] ?? 9
  const bo = COMPLETE_ORDER[lifecycleOf(b)] ?? 9
  if (ao !== bo) return ao - bo
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

function sortByCreatedDesc(a: OperatorStudyRow, b: OperatorStudyRow): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

const ghostBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  padding: '4px 0',
  color: 'var(--ink-50)',
}

const headerCell: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  padding: '10px 12px',
}

type ConfirmState =
  | null
  | { kind: 'close'; row: OperatorStudyRow }
  | { kind: 'hard_delete'; row: WithdrawnStudyRow }

type ToastState =
  | { kind: 'plain'; message: string }
  | {
      kind: 'withdraw_undo'
      message: string
      missionId: string
      studySnapshot: OperatorStudyRow
    }

interface Props {
  studies: OperatorStudyRow[]
  withdrawn: WithdrawnStudyRow[]
}

export default function AdminStudiesClient({ studies, withdrawn }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [launchpadOpen, setLaunchpadOpen] = useState(false)

  const [studyRows, setStudyRows] = useState(studies)
  const [withdrawnRows, setWithdrawnRows] = useState(withdrawn)
  const [tab, setTab] = useState<StudiesTab>(() => parseTab(searchParams.get('tab')))

  useEffect(() => {
    setStudyRows(studies)
    setWithdrawnRows(withdrawn)
  }, [studies, withdrawn])

  useEffect(() => {
    setTab(parseTab(searchParams.get('tab')))
  }, [searchParams])

  useEffect(() => {
    if (!toast) return
    const ms = toast.kind === 'withdraw_undo' ? 6000 : 3500
    const t = setTimeout(() => setToast(null), ms)
    return () => clearTimeout(t)
  }, [toast])

  const showBrand = useMemo(
    () => isMultiBrand({ studies: studyRows, withdrawn: withdrawnRows }),
    [studyRows, withdrawnRows]
  )

  const counts = useMemo(() => {
    let active = 0
    let complete = 0
    let draft = 0
    for (const row of studyRows) {
      const bucket = tabForRow(row)
      if (bucket === 'active') active += 1
      else if (bucket === 'complete') complete += 1
      else draft += 1
    }
    return { active, complete, draft }
  }, [studyRows])

  const visibleRows = useMemo(() => {
    const filtered = studyRows.filter((row) => tabForRow(row) === tab)
    if (tab === 'complete') return [...filtered].sort(sortComplete)
    return [...filtered].sort(sortByCreatedDesc)
  }, [studyRows, tab])

  const selectTab = useCallback(
    (next: StudiesTab) => {
      setTab(next)
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'active') params.delete('tab')
      else params.set('tab', next)
      const qs = params.toString()
      router.replace(qs ? `/studies?${qs}` : '/studies', { scroll: false })
    },
    [router, searchParams]
  )

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const executeWithdraw = useCallback(
    async (row: OperatorStudyRow) => {
      setBusyId(row.mission_id)
      setErrorBanner(null)
      const result = await withdrawMissionAction(row.mission_id)
      setBusyId(null)
      setConfirm(null)
      if (!result.ok) {
        setErrorBanner(result.error)
        return
      }
      setStudyRows((rows) => rows.filter((r) => r.mission_id !== row.mission_id))
      setWithdrawnRows((rows) => [
        withdrawnFromStudy(row),
        ...rows.filter((r) => r.mission_id !== row.mission_id),
      ])
      setToast({
        kind: 'withdraw_undo',
        message: 'Moved to withdrawn',
        missionId: row.mission_id,
        studySnapshot: row,
      })
      refresh()
    },
    [refresh]
  )

  const undoWithdraw = useCallback(async () => {
    if (!toast || toast.kind !== 'withdraw_undo') return
    const pendingUndo = toast
    setBusyId(pendingUndo.missionId)
    setErrorBanner(null)
    const result = await restoreMissionAction(pendingUndo.missionId)
    setBusyId(null)
    if (!result.ok) {
      setErrorBanner(result.error)
      return
    }
    setWithdrawnRows((rows) => rows.filter((r) => r.mission_id !== pendingUndo.missionId))
    setStudyRows((rows) => [pendingUndo.studySnapshot, ...rows])
    setToast({ kind: 'plain', message: 'Restored' })
    refresh()
  }, [toast, refresh])

  const runRestore = useCallback(
    async (missionId: string) => {
      setBusyId(missionId)
      setErrorBanner(null)
      const result = await restoreMissionAction(missionId)
      setBusyId(null)
      if (!result.ok) {
        setErrorBanner(result.error)
        return
      }
      setWithdrawnRows((rows) => rows.filter((r) => r.mission_id !== missionId))
      setToast({ kind: 'plain', message: result.message ?? 'Restored' })
      refresh()
    },
    [refresh]
  )

  const executeHardDelete = useCallback(
    async (row: WithdrawnStudyRow) => {
      setBusyId(row.mission_id)
      setErrorBanner(null)
      const result = await hardDeleteMissionAction(row.mission_id)
      setBusyId(null)
      setConfirm(null)
      if (!result.ok) {
        setErrorBanner(result.error)
        return
      }
      setWithdrawnRows((rows) => rows.filter((r) => r.mission_id !== row.mission_id))
      setToast({ kind: 'plain', message: result.message ?? 'Permanently deleted' })
      refresh()
    },
    [refresh]
  )

  const executeCloseStudy = useCallback(
    async (row: OperatorStudyRow) => {
      setBusyId(row.mission_id)
      setErrorBanner(null)
      const result = await closeStudyAction(row.mission_id)
      setBusyId(null)
      setConfirm(null)
      if (!result.ok) {
        setErrorBanner(result.error)
        return
      }
      setStudyRows((rows) =>
        rows.map((r) =>
          r.mission_id === row.mission_id
            ? {
                ...r,
                is_finished: true,
                status: 'completed',
                lifecycle_state: 'completed',
              }
            : r
        )
      )
      setToast({ kind: 'plain', message: 'Moved to Complete' })
      refresh()
    },
    [refresh]
  )

  const confirmBusy = confirm != null && busyId != null

  const emptyCopy: Record<StudiesTab, string> = {
    active: 'No active studies — start one with New study.',
    complete: 'No finished studies yet. Closed or expired work will show up here.',
    draft: 'No drafts in progress.',
  }

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 36px 48px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 32,
              fontWeight: 400,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Studies
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 14,
              color: 'var(--ink-50)',
              lineHeight: 1.45,
            }}
          >
            Create, manage, and review consumer research.
          </p>
        </div>
        <NewStudyMenu onStartFromProduct={() => setLaunchpadOpen(true)} />
      </header>

      <div style={{ marginBottom: 28 }}>
        <StudiesMetricStrip rows={studyRows} />
      </div>

      <ConceptDraftsPanel
        onCreateProductTest={() => setLaunchpadOpen(true)}
      />

      <LaunchpadModal open={launchpadOpen} onClose={() => setLaunchpadOpen(false)} />

      <ConfirmDialog
        open={confirm?.kind === 'close'}
        title="Close study?"
        body={
          confirm?.kind === 'close' ? (
            inFlightEstimate(confirm.row) > 0 ? (
              <>
                This will stop up to{' '}
                <strong>{inFlightEstimate(confirm.row)}</strong> in-progress respondent
                {inFlightEstimate(confirm.row) === 1 ? '' : 's'} for “{confirm.row.title}”.
              </>
            ) : (
              <>“{confirm.row.title}” will mark as completed.</>
            )
          ) : null
        }
        confirmLabel="Close study"
        tone="caution"
        busy={confirmBusy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'close') void executeCloseStudy(confirm.row)
        }}
      />

      <ConfirmDialog
        open={confirm?.kind === 'hard_delete'}
        title="Delete forever?"
        body={
          confirm?.kind === 'hard_delete' ? (
            <>
              Permanently delete “{confirm.row.title}”? This can&apos;t be undone.
            </>
          ) : null
        }
        confirmLabel="Delete forever"
        tone="destructive"
        busy={confirmBusy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'hard_delete') void executeHardDelete(confirm.row)
        }}
      />

      {toast ? (
        <div
          role="status"
          style={{
            marginTop: 20,
            fontSize: 13,
            color: 'var(--sage-dark)',
            background: 'var(--sage-soft, var(--sage-pale))',
            border: '1px solid rgba(62, 107, 74, 0.2)',
            borderRadius: 'var(--r-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span>{toast.message}</span>
          {toast.kind === 'withdraw_undo' ? (
            <button
              type="button"
              disabled={busyId === toast.missionId || pending}
              onClick={() => void undoWithdraw()}
              style={{
                ...ghostBtn,
                color: 'var(--sage)',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : null}

      {errorBanner ? (
        <div
          role="alert"
          style={{
            marginTop: 20,
            fontSize: 13,
            color: 'var(--ink)',
            background: 'var(--surface-1)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '10px 14px',
          }}
        >
          {errorBanner}
        </div>
      ) : null}

      <section style={{ marginTop: 8 }}>
        <div
          role="tablist"
          aria-label="Study lifecycle"
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid var(--ink-10)',
            marginBottom: 0,
          }}
        >
          {TAB_KEYS.map((key) => {
            const selected = tab === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectTab(key)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: selected ? 600 : 500,
                  color: selected ? 'var(--ink)' : 'var(--ink-30)',
                  padding: '10px 14px 12px',
                  marginBottom: -1,
                  borderBottom: selected
                    ? '2px solid var(--sage)'
                    : '2px solid transparent',
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                <span>{TAB_LABELS[key]}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                    color: selected ? 'var(--ink-50)' : 'var(--ink-30)',
                  }}
                >
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>

        {visibleRows.length === 0 ? (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              padding: '36px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: 0, lineHeight: 1.55 }}>
              {emptyCopy[tab]}
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              overflowX: 'auto',
            }}
          >
            {(() => {
              const showStatus = tab !== 'active'
              const grid = showStatus ? GRID_WITH_STATUS : GRID_NO_STATUS
              return (
                <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: grid,
                alignItems: 'center',
                borderBottom: '1px solid var(--ink-10)',
                background: 'var(--surface-1)',
              }}
            >
              <div style={headerCell}>Study</div>
              <div style={headerCell}>Type</div>
              <div style={headerCell}>Progress</div>
              {showStatus ? <div style={headerCell}>Status</div> : null}
              <div style={headerCell}>Created</div>
              <div style={headerCell}>Action</div>
              <div style={{ ...headerCell, paddingRight: 8 }} />
            </div>

            {visibleRows.map((row) => {
              const state = lifecycleOf(row)
              const progress = claimProgress(row)
              // Active tab already implies status — column hidden; pills on Complete / Draft.
              const pill = showStatus ? statusPill(state) : null
              const meta =
                row.mission_type === 'concept_test'
                  ? 'Concept field'
                  : (row.focal_product_name ?? 'Product pending')
              const canClose = tab === 'active' && isActiveBucket(state)
              const primaryHref =
                tab === 'draft' ? draftContinueHref(row) : reportHref(row)
              const primaryLabel = tab === 'draft' ? 'Continue →' : 'View report →'

              const overflow =
                tab === 'draft'
                  ? [
                      {
                        label: 'Delete draft',
                        tone: 'danger' as const,
                        disabled: busyId === row.mission_id || pending,
                        onClick: () => void executeWithdraw(row),
                      },
                    ]
                  : [
                      ...(canClose
                        ? [
                            {
                              label: 'Close study',
                              disabled: busyId === row.mission_id || pending,
                              onClick: () => setConfirm({ kind: 'close', row }),
                            },
                          ]
                        : []),
                      {
                        label: 'Withdraw',
                        disabled: busyId === row.mission_id || pending,
                        onClick: () => void executeWithdraw(row),
                      },
                    ]

              return (
                <div
                  key={row.mission_id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: grid,
                    alignItems: 'center',
                    borderBottom: '1px solid var(--ink-10)',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 12px',
                      minWidth: 0,
                    }}
                  >
                    <div
                      aria-hidden
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: 'var(--sage-soft, var(--sage-pale))',
                        color: 'var(--sage-dark)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {publishedTypeLabel(row.mission_type).slice(0, 1)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--ink)',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={row.title}
                      >
                        {row.title ||
                          `${publishedTypeLabel(row.mission_type)}${
                            row.brand_name ? ` · ${row.brand_name}` : ''
                          }`}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--ink-50)',
                          marginTop: 3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {meta}
                        {showBrand && row.brand_name ? ` · ${row.brand_name}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '14px 12px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 8,
                        color: 'var(--ink-50)',
                        background: 'var(--surface-1)',
                      }}
                    >
                      {publishedTypeLabel(row.mission_type)}
                    </span>
                  </div>

                  <div style={{ padding: '14px 12px', minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        fontVariantNumeric: 'tabular-nums',
                        marginBottom: progress.ratio != null ? 6 : 0,
                      }}
                    >
                      {progress.label}
                    </div>
                    {progress.ratio != null ? (
                      <div
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: 'var(--mist, var(--surface-1))',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.round(progress.ratio * 100)}%`,
                            height: '100%',
                            background: 'var(--sage)',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  {showStatus ? (
                    <div style={{ padding: '14px 12px' }}>
                      {pill ? (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.03em',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: 8,
                            color: pill.color,
                            background: pill.background,
                          }}
                        >
                          {pill.label}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div
                    style={{
                      padding: '14px 12px',
                      fontSize: 12,
                      color: 'var(--ink-50)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {relativeTime(row.created_at)}
                  </div>

                  <div style={{ padding: '14px 8px 14px 12px' }}>
                    {tab === 'draft' ? (
                      <button
                        type="button"
                        onClick={() => router.push(primaryHref)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--sage)',
                          padding: 0,
                        }}
                      >
                        {primaryLabel}
                      </button>
                    ) : (
                      <Link
                        href={primaryHref}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--sage)',
                          textDecoration: 'none',
                        }}
                      >
                        {primaryLabel}
                      </Link>
                    )}
                  </div>

                  <div
                    style={{
                      padding: '8px 8px 8px 0',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <RowOverflowMenu actions={overflow} />
                  </div>
                </div>
              )
            })}
                </>
              )
            })()}
          </div>
        )}
      </section>

      {withdrawnRows.length > 0 ? (
        <section style={{ marginTop: 40, opacity: 0.9 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 400,
                color: 'var(--ink-50)',
                margin: 0,
              }}
            >
              Withdrawn
            </h3>
            <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>
              {withdrawnRows.length} archived
            </span>
          </div>

          <div
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--ink-10)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {withdrawnRows.map((row, i) => {
              const canHardDelete = row.total_claims === 0
              return (
                <div
                  key={row.mission_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    width: '100%',
                    padding: '16px 20px',
                    borderBottom:
                      i < withdrawnRows.length - 1 ? '1px solid var(--ink-10)' : 'none',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--ink-50)',
                        marginBottom: 4,
                      }}
                    >
                      {row.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--ink-30)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.focal_product_name ?? 'No product'}
                      {showBrand && row.brand_name ? ` · ${row.brand_name}` : ''}
                      {` · Withdrawn ${relativeTime(row.deleted_at)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                      type="button"
                      disabled={busyId === row.mission_id || pending}
                      onClick={() => void runRestore(row.mission_id)}
                      style={{
                        ...ghostBtn,
                        color: 'var(--sage)',
                        opacity: busyId === row.mission_id ? 0.5 : 1,
                      }}
                    >
                      Restore
                    </button>
                    {canHardDelete ? (
                      <button
                        type="button"
                        disabled={busyId === row.mission_id || pending}
                        onClick={() => setConfirm({ kind: 'hard_delete', row })}
                        style={{
                          ...ghostBtn,
                          color: 'var(--ink-50)',
                          opacity: busyId === row.mission_id ? 0.5 : 1,
                        }}
                      >
                        Delete forever
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
