'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import StudiesMetricStrip from './components/StudiesMetricStrip'
import StudyDraftsPanel from './components/StudyDraftsPanel'
import RowOverflowMenu from './components/RowOverflowMenu'
import {
  ActiveStudyList,
  CompletedSectionHead,
  CompletedStudyList,
  DraftsSectionHead,
  InProgressEmpty,
  InProgressSectionHead,
} from './components/StudyLifecycleLists'
import { ICON_ARCHIVE, StudiesGlyph } from './components/studiesIcons'
import type { StudyDraftListItem } from './drafts/actions'
import './studiesPage.css'

const COMPLETE_ORDER: Record<string, number> = {
  completed: 0,
  expired: 1,
  archived: 2,
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

function isCompleteBucket(state: OperatorStudyLifecycleState): boolean {
  return state === 'completed' || state === 'expired' || state === 'archived'
}

function isDraftBucket(state: OperatorStudyLifecycleState): boolean {
  return state === 'draft'
}

/** Same buckets the Active/Complete tabs used. Draft operator rows stay hidden. */
function bucketForRow(row: OperatorStudyRow): 'active' | 'complete' | null {
  const state = lifecycleOf(row)
  if (isDraftBucket(state)) return null
  if (isCompleteBucket(state)) return 'complete'
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

function inFlightEstimate(row: OperatorStudyRow): number {
  return Math.max(0, row.total_claims - row.completed_claims)
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
  drafts: StudyDraftListItem[]
  effectiveBrandId: number
  canOperate: boolean
  brandName?: string | null
}


export default function StudiesClient({
  studies,
  withdrawn,
  drafts: initialDrafts,
  effectiveBrandId,
  canOperate,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

  const [studyRows, setStudyRows] = useState(studies)
  const [withdrawnRows, setWithdrawnRows] = useState(withdrawn)
  const [draftRows, setDraftRows] = useState(initialDrafts)

  useEffect(() => {
    setStudyRows(studies)
    setWithdrawnRows(withdrawn)
  }, [studies, withdrawn])

  useEffect(() => {
    setDraftRows(initialDrafts)
  }, [initialDrafts])

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

  const activeRows = useMemo(() => {
    return studyRows
      .filter((row) => bucketForRow(row) === 'active')
      .sort(sortByCreatedDesc)
  }, [studyRows])

  const completeRows = useMemo(() => {
    return studyRows
      .filter((row) => bucketForRow(row) === 'complete')
      .sort(sortComplete)
  }, [studyRows])

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

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'var(--cream)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div className="studies-canvas">
        <header className="studies-header">
          <div style={{ minWidth: 0 }}>
            <h1 className="studies-title">Studies</h1>
            <p className="studies-lede">
              Preference studies and results from verified consumers.
            </p>
          </div>
          <Link href="/studies/new" className="studies-new-study">
            <span aria-hidden style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>
              +
            </span>
            New study
          </Link>
        </header>

        <div className="studies-kpi-wrap">
          <StudiesMetricStrip
            rows={studyRows}
            draftCount={draftRows.length}
            completedCount={completeRows.length}
          />
        </div>

        {canOperate ? (
          <>
            <ConfirmDialog
              open={confirm?.kind === 'close'}
              title="Close study?"
              body={
                confirm?.kind === 'close' ? (
                  inFlightEstimate(confirm.row) > 0 ? (
                    <>
                      This will stop up to{' '}
                      <strong>{inFlightEstimate(confirm.row)}</strong> in-progress
                      respondent
                      {inFlightEstimate(confirm.row) === 1 ? '' : 's'} for “
                      {confirm.row.title}”.
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
          </>
        ) : null}

        {toast && canOperate ? (
          <div
            role="status"
            style={{
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--sage-dark)',
              background: 'var(--sage-soft, var(--sage-pale))',
              border: '1px solid rgba(62, 107, 74, 0.2)',
              borderRadius: 'var(--r-md, 8px)',
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
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--ink)',
              background: 'var(--paper, var(--white))',
              border: '1px solid var(--mist, var(--ink-10))',
              borderRadius: 'var(--r-md, 8px)',
              padding: '10px 14px',
            }}
          >
            {errorBanner}
          </div>
        ) : null}

        <section className="studies-lifecycle">
          <InProgressSectionHead />
          {activeRows.length === 0 ? (
            <InProgressEmpty />
          ) : (
            <ActiveStudyList
              rows={activeRows}
              canOperate={canOperate}
              busyId={busyId}
              pending={pending}
              showBrand={showBrand}
              onClose={(row) => setConfirm({ kind: 'close', row })}
              onWithdraw={(row) => void executeWithdraw(row)}
            />
          )}
        </section>

        <section className="studies-lifecycle">
          <DraftsSectionHead />
          <StudyDraftsPanel
            drafts={draftRows}
            effectiveBrandId={effectiveBrandId}
            onChange={setDraftRows}
            onError={(message) => setErrorBanner(message || null)}
            onToast={(message) => setToast({ kind: 'plain', message })}
          />
        </section>

        <section className="studies-lifecycle">
          <CompletedSectionHead />
          {completeRows.length === 0 ? (
            <p className="studies-empty-quiet">No completed studies yet.</p>
          ) : (
            <CompletedStudyList
              rows={completeRows}
              canOperate={canOperate}
              busyId={busyId}
              pending={pending}
              showBrand={showBrand}
              onClose={(row) => setConfirm({ kind: 'close', row })}
              onWithdraw={(row) => void executeWithdraw(row)}
            />
          )}
        </section>

        {canOperate && withdrawnRows.length > 0 ? (
          <section>
            <div className={`studies-archive-card${isArchiveOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="studies-archive-toggle"
                aria-expanded={isArchiveOpen}
                aria-controls="archived-studies-panel"
                onClick={() => setIsArchiveOpen((open) => !open)}
              >
                <span className="studies-archive-toggle-left">
                  <span className="studies-archive-icon">
                    <StudiesGlyph d={ICON_ARCHIVE} size={16} />
                  </span>
                  <h2 className="studies-archive-title">Archived studies</h2>
                  <span className="studies-archive-count">({withdrawnRows.length})</span>
                </span>
                <svg
                  className={`studies-archive-chevron${isArchiveOpen ? ' is-open' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isArchiveOpen ? (
                <div id="archived-studies-panel" className="studies-archive-body">
                  {withdrawnRows.map((row) => {
                    const canHardDelete = row.total_claims === 0
                    const meta = [
                      row.focal_product_name ?? 'No product',
                      showBrand && row.brand_name ? row.brand_name : null,
                      relativeTime(row.deleted_at),
                    ]
                      .filter(Boolean)
                      .join(' · ')
                    return (
                      <div key={row.mission_id} className="studies-archive-row">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="studies-archive-name">{row.title}</div>
                          <div className="studies-archive-meta">
                            <span className="studies-withdrawn-badge">Withdrawn</span>
                            {meta}
                          </div>
                        </div>
                        <div className="studies-archive-actions">
                          <button
                            type="button"
                            className="studies-archive-restore"
                            disabled={busyId === row.mission_id || pending}
                            onClick={() => void runRestore(row.mission_id)}
                          >
                            Restore
                          </button>
                          {canHardDelete ? (
                            <RowOverflowMenu
                              actions={[
                                {
                                  label: 'Delete forever',
                                  tone: 'danger',
                                  disabled: busyId === row.mission_id || pending,
                                  onClick: () => setConfirm({ kind: 'hard_delete', row }),
                                },
                              ]}
                            />
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
