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
import type { OperatorDraftMission } from '@/lib/queries'
import type { OperatorStudyRow, WithdrawnStudyRow } from '@/lib/studies/types'
import OperatorLaunchpad from '../components/OperatorLaunchpad'
import {
  hardDeleteMissionAction,
  restoreMissionAction,
  withdrawMissionAction,
} from './missionTrashActions'
import { closeStudyAction } from './closeStudyAction'
import ConfirmDialog from './ConfirmDialog'
import ConceptDraftsPanel from './concept/ConceptDraftsPanel'

function studyLabel(missionType: string, objective: string): string {
  if (missionType === 'concept_test') return 'Concept'
  if (missionType === 'product_discovery') return 'Discovery'
  if (missionType === 'verified_purchase') return 'Verified purchase'
  if (missionType === 'brand_challenge' && objective === 'depth') return 'Positioning'
  if (missionType === 'brand_challenge' && objective === 'conquest') return 'Head-to-Head'
  if (missionType === 'brand_challenge') return 'Challenge'
  return 'Study'
}

function publishedTypeLabel(missionType: string | null | undefined): string {
  if (!missionType) return 'Study'
  return studyLabel(missionType, '')
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isMultiBrand(args: {
  drafts: OperatorDraftMission[]
  studies: OperatorStudyRow[]
  withdrawn: WithdrawnStudyRow[]
}): boolean {
  const ids = new Set<number>()
  for (const row of args.drafts) ids.add(row.brand_id)
  for (const row of args.studies) {
    if (row.brand_id != null) ids.add(row.brand_id)
  }
  for (const row of args.withdrawn) {
    if (row.brand_id != null) ids.add(row.brand_id)
  }
  return ids.size > 1
}

function claimProgressLabel(row: OperatorStudyRow): string {
  const target =
    typeof row.target_completions === 'number' && row.target_completions > 0
      ? row.target_completions
      : null
  if (target != null) {
    return `${row.completed_claims} / ${target} ordered`
  }
  if (row.total_claims === 0) return 'No responses yet'
  return `${row.completed_claims} / ${row.total_claims} claims`
}

function inFlightEstimate(row: OperatorStudyRow): number {
  return Math.max(0, row.total_claims - row.completed_claims)
}

function studyStatusPill(row: OperatorStudyRow): {
  label: string
  color: string
  background: string
} {
  if (row.is_finished || row.status === 'completed') {
    return {
      label: 'Completed',
      color: 'var(--ink)',
      background: 'rgba(45, 55, 72, 0.08)',
    }
  }
  if (row.status === 'paused') {
    return {
      label: 'Paused',
      color: 'var(--amber, #C07818)',
      background: 'var(--amber-pale, #FBF3E8)',
    }
  }
  return { label: 'Active', color: 'var(--sage)', background: 'var(--sage-soft)' }
}

function withdrawnFromDraft(draft: OperatorDraftMission): WithdrawnStudyRow {
  return {
    mission_id: draft.mission_id,
    title: `${studyLabel(draft.mission_type, draft.campaign_objective)} · ${draft.brand_name}`,
    status: 'draft',
    is_draft: true,
    brand_id: draft.brand_id,
    brand_name: draft.brand_name,
    focal_product_id: null,
    focal_product_name: draft.product_name,
    template_code: null,
    total_claims: 0,
    completed_claims: 0,
    created_at: draft.created_at,
    deleted_at: new Date().toISOString(),
  }
}

function withdrawnFromStudy(row: OperatorStudyRow): WithdrawnStudyRow {
  return {
    mission_id: row.mission_id,
    title: row.title,
    status: row.status,
    is_draft: false,
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
      from: 'draft' | 'published'
      draftSnapshot?: OperatorDraftMission
      studySnapshot?: OperatorStudyRow
    }

interface Props {
  drafts: OperatorDraftMission[]
  studies: OperatorStudyRow[]
  withdrawn: WithdrawnStudyRow[]
}

export default function AdminStudiesClient({ drafts, studies, withdrawn }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const [draftRows, setDraftRows] = useState(drafts)
  const [studyRows, setStudyRows] = useState(studies)
  const [withdrawnRows, setWithdrawnRows] = useState(withdrawn)

  useEffect(() => {
    setDraftRows(drafts)
    setStudyRows(studies)
    setWithdrawnRows(withdrawn)
  }, [drafts, studies, withdrawn])

  useEffect(() => {
    if (!toast) return
    const ms = toast.kind === 'withdraw_undo' ? 6000 : 3500
    const t = setTimeout(() => setToast(null), ms)
    return () => clearTimeout(t)
  }, [toast])

  const showBrand = useMemo(
    () => isMultiBrand({ drafts: draftRows, studies: studyRows, withdrawn: withdrawnRows }),
    [draftRows, studyRows, withdrawnRows]
  )

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const executeWithdraw = useCallback(
    async (args: {
      missionId: string
      from: 'draft' | 'published'
      draftSnapshot?: OperatorDraftMission
      studySnapshot?: OperatorStudyRow
    }) => {
      setBusyId(args.missionId)
      setErrorBanner(null)
      const result = await withdrawMissionAction(args.missionId)
      setBusyId(null)
      setConfirm(null)
      if (!result.ok) {
        setErrorBanner(result.error)
        return
      }
      if (args.from === 'draft' && args.draftSnapshot) {
        setDraftRows((rows) => rows.filter((r) => r.mission_id !== args.missionId))
        setWithdrawnRows((rows) => [
          withdrawnFromDraft(args.draftSnapshot!),
          ...rows.filter((r) => r.mission_id !== args.missionId),
        ])
      } else if (args.from === 'published' && args.studySnapshot) {
        setStudyRows((rows) => rows.filter((r) => r.mission_id !== args.missionId))
        setWithdrawnRows((rows) => [
          withdrawnFromStudy(args.studySnapshot!),
          ...rows.filter((r) => r.mission_id !== args.missionId),
        ])
      }
      setToast({
        kind: 'withdraw_undo',
        message: 'Moved to withdrawn',
        missionId: args.missionId,
        from: args.from,
        draftSnapshot: args.draftSnapshot,
        studySnapshot: args.studySnapshot,
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
    if (pendingUndo.from === 'draft' && pendingUndo.draftSnapshot) {
      setDraftRows((rows) => [pendingUndo.draftSnapshot!, ...rows])
    } else if (pendingUndo.from === 'published' && pendingUndo.studySnapshot) {
      setStudyRows((rows) => [pendingUndo.studySnapshot!, ...rows])
    }
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
            ? { ...r, is_finished: true, status: 'completed' }
            : r
        )
      )
      setToast({ kind: 'plain', message: result.message })
      refresh()
    },
    [refresh]
  )

  const confirmBusy = confirm != null && busyId != null

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 900, margin: '0 auto', padding: '36px 32px' }}>
      <OperatorLaunchpad variant="compact" />

      <ConceptDraftsPanel />

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
            background: 'var(--sage-soft)',
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

      {draftRows.length > 0 && (
        <section style={{ marginTop: 36 }}>
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
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Your drafts
            </h3>
            <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>{draftRows.length} in progress</span>
          </div>

          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
            }}
          >
            {draftRows.map((draft, i) => (
              <div
                key={draft.mission_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  width: '100%',
                  padding: '16px 20px',
                  borderBottom: i < draftRows.length - 1 ? '1px solid var(--ink-10)' : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({
                      brandId: String(draft.brand_id),
                      missionId: draft.mission_id,
                    })
                    router.push(`/admin/studies/new?${params.toString()}`)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                    padding: 0,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>
                      {studyLabel(draft.mission_type, draft.campaign_objective)} · {draft.brand_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {draft.product_name ?? 'No product selected yet'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 16 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{relativeTime(draft.created_at)}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sage)' }}>Continue →</span>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={busyId === draft.mission_id || pending}
                  onClick={() =>
                    void executeWithdraw({
                      missionId: draft.mission_id,
                      from: 'draft',
                      draftSnapshot: draft,
                    })
                  }
                  style={{
                    ...ghostBtn,
                    color: 'var(--ink-50)',
                    flexShrink: 0,
                    opacity: busyId === draft.mission_id ? 0.5 : 1,
                  }}
                >
                  Delete draft
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 36 }}>
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
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Published studies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {studyRows.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>
                {studyRows.length} {studyRows.length === 1 ? 'study' : 'studies'}
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--ink-30)', maxWidth: 320, textAlign: 'right', lineHeight: 1.4 }}>
              Close finishes the study for respondents. Withdraw archives it (reversible).
            </span>
          </div>
        </div>

        {studyRows.length === 0 ? (
          <div
            style={{
              background: 'var(--surface-1)',
              border: '1px dashed var(--ink-10)',
              borderRadius: 'var(--r-md)',
              padding: '28px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: 0, lineHeight: 1.55 }}>
              No published studies yet — launch one above.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
            }}
          >
            {studyRows.map((row, i) => {
              const muted = row.is_finished || row.status === 'completed'
              const titleColor = muted ? 'var(--ink-50)' : 'var(--ink)'
              const metaColor = muted ? 'var(--ink-30)' : 'var(--ink-50)'
              const pill = studyStatusPill(row)
              const canClose =
                !muted && (row.status === 'active' || row.status === 'paused')

              return (
                <div
                  key={row.mission_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    width: '100%',
                    padding: '16px 20px',
                    borderBottom: i < studyRows.length - 1 ? '1px solid var(--ink-10)' : 'none',
                    opacity: muted ? 0.85 : 1,
                  }}
                >
                  <Link
                    href={
                      row.mission_type === 'concept_test'
                        ? `/studies/concept/${row.mission_id}/report`
                        : `/reports/${row.mission_id}`
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flex: 1,
                      minWidth: 0,
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 500, color: titleColor }}>
                          {row.title}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: 10,
                            color: 'var(--ink-50)',
                            background: 'var(--surface-1)',
                          }}
                        >
                          {publishedTypeLabel(row.mission_type)}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: 10,
                            color: pill.color,
                            background: pill.background,
                          }}
                        >
                          {pill.label}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: metaColor,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.mission_type === 'concept_test'
                          ? 'Concept field'
                          : (row.focal_product_name ?? 'Product pending')}
                        {showBrand && row.brand_name ? ` · ${row.brand_name}` : ''}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: 'var(--font-mono, var(--font-sans))',
                          color: metaColor,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {claimProgressLabel(row)}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: muted ? 'var(--ink-30)' : 'var(--sage)' }}>
                        View report →
                      </span>
                    </div>
                  </Link>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    {canClose ? (
                      <button
                        type="button"
                        disabled={busyId === row.mission_id || pending}
                        onClick={() => setConfirm({ kind: 'close', row })}
                        title="Finish this study now — stops in-progress respondents"
                        style={{
                          border: '1px solid var(--ink-10)',
                          background: 'var(--ink)',
                          color: 'var(--white, #fff)',
                          cursor: busyId === row.mission_id ? 'default' : 'pointer',
                          fontFamily: 'var(--font-sans)',
                          fontSize: 12,
                          fontWeight: 500,
                          padding: '6px 12px',
                          borderRadius: 'var(--r-sm)',
                          opacity: busyId === row.mission_id ? 0.5 : 1,
                        }}
                      >
                        Close study
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busyId === row.mission_id || pending}
                      onClick={() =>
                        void executeWithdraw({
                          missionId: row.mission_id,
                          from: 'published',
                          studySnapshot: row,
                        })
                      }
                      title="Move to Withdrawn archive — you can restore later"
                      style={{
                        ...ghostBtn,
                        color: 'var(--ink-30)',
                        fontSize: 11,
                        opacity: busyId === row.mission_id ? 0.5 : 1,
                      }}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {withdrawnRows.length > 0 ? (
        <section style={{ marginTop: 36, opacity: 0.85 }}>
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
              borderRadius: 'var(--r-md)',
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
                    borderBottom: i < withdrawnRows.length - 1 ? '1px solid var(--ink-10)' : 'none',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-50)' }}>
                        {row.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 10,
                          color: 'var(--ink-50)',
                          background: 'var(--white)',
                        }}
                      >
                        {row.is_draft ? 'Draft' : 'Study'}
                      </span>
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

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      flexShrink: 0,
                    }}
                  >
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
