'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  safetyDeskHref,
  safetyPersonLabel,
  type SafetyModerationAction,
  type SafetyReportRow,
} from '@/lib/safety.shared'
import {
  getSafetyReportAction,
  moderateSafetyReportAction,
  reinstateUserAction,
} from '../actions'

export function useSafetyDesk({
  initialRows,
  initialTotal,
  focusId,
  loadError,
}: {
  initialRows: SafetyReportRow[]
  initialTotal: number
  focusId: number | null
  loadError: string | null
}) {
const router = useRouter()
const [rows, setRows] = useState(initialRows)
const [total, setTotal] = useState(initialTotal)
const [selectedId, setSelectedId] = useState<number | null>(
  focusId ?? initialRows[0]?.report_id ?? null,
)
const [detail, setDetail] = useState<SafetyReportRow | null>(null)
const [actions, setActions] = useState<SafetyModerationAction[]>([])
const [note, setNote] = useState('')
const [banner, setBanner] = useState<{ tone: 'ok' | 'error'; text: string } | null>(
  loadError ? { tone: 'error', text: loadError } : null,
)
const [pending, startTransition] = useTransition()

const selected = useMemo(
  () => rows.find((r) => r.report_id === selectedId) ?? detail,
  [rows, selectedId, detail],
)

const loadDetail = useCallback((reportId: number) => {
  startTransition(async () => {
    const res = await getSafetyReportAction(reportId)
    if (!res.ok || !res.report) {
      setBanner({ tone: 'error', text: res.error ?? 'Could not load that case.' })
      return
    }
    setDetail(res.report)
    setActions(res.actions ?? [])
  })
}, [])

useEffect(() => {
  if (selectedId == null) return
  loadDetail(selectedId)
}, [selectedId, loadDetail])

useEffect(() => {
  if (focusId != null && focusId !== selectedId) {
    setSelectedId(focusId)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [focusId])

const selectCase = (id: number) => {
  setSelectedId(id)
  setNote('')
  setBanner(null)
  router.replace(safetyDeskHref({ focusId: id }), { scroll: false })
}

const act = (outcome: 'dismiss' | 'remove_content' | 'suspend') => {
  if (selectedId == null) return
  startTransition(async () => {
    const res = await moderateSafetyReportAction(selectedId, outcome, note.trim() || null)
    if (!res.ok) {
      setBanner({ tone: 'error', text: res.error ?? 'Action failed.' })
      return
    }
    setRows((prev) => prev.filter((r) => r.report_id !== selectedId))
    setTotal((t) => Math.max(0, t - 1))
    setBanner({
      tone: 'ok',
      text:
        outcome === 'dismiss'
          ? 'Dismissed. Case closed.'
          : outcome === 'suspend'
            ? 'Account suspended. Avatar purge queued.'
            : 'Content removed.',
    })
    const next = rows.find((r) => r.report_id !== selectedId)
    if (next) {
      setSelectedId(next.report_id)
      router.replace(safetyDeskHref({ focusId: next.report_id }), { scroll: false })
    } else {
      setSelectedId(null)
      setDetail(null)
      setActions([])
      router.replace(safetyDeskHref(), { scroll: false })
    }
    setNote('')
  })
}

const reinstate = () => {
  if (!selected) return
  startTransition(async () => {
    const res = await reinstateUserAction(selected.target_user_id, note.trim() || null)
    if (!res.ok) {
      setBanner({ tone: 'error', text: res.error ?? 'Could not reinstate.' })
      return
    }
    setBanner({ tone: 'ok', text: 'Account reinstated.' })
    loadDetail(selected.report_id)
  })
}

const who = selected
  ? safetyPersonLabel(
      selected.target_display_name ?? selected.snapshot.display_name,
      selected.target_handle ?? selected.snapshot.handle,
      selected.target_user_id,
    )
  : ''

  return {
    rows,
    total,
    selectedId,
    selected,
    actions,
    note,
    setNote,
    banner,
    pending,
    selectCase,
    act,
    reinstate,
    who,
  }
}
