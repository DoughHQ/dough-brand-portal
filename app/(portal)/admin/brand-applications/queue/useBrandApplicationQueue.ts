'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  sortApplicationsForQueue,
  type BrandApplication,
  type BrandApplicationsPageCursor,
  type CatalogCandidate,
} from '@/lib/brandApplications'
import {
  decideBrandApplicationAction,
  listBrandWaitlistApplicationsAction,
} from '../actions'
import type { ApproveSubmit } from '../ApplicationDecisionDialogs'
import type { BrandApplicationDialog } from './brandApplicationDialog'
import type { QueueBanner } from './ApplicationQueueBanner'

const REACH_SERVER =
  'Couldn’t reach the server. Refresh to check whether it went through.'

export function useBrandApplicationQueue({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  initialError,
}: {
  initialRows: BrandApplication[]
  initialHasMore?: boolean
  initialCursor?: BrandApplicationsPageCursor | null
  initialError?: string | null
}) {
  const [rows, setRows] = useState(initialRows)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState<BrandApplicationsPageCursor | null>(initialCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [banner, setBanner] = useState<QueueBanner | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<BrandApplicationDialog>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [candidateOverride, setCandidateOverride] = useState<CatalogCandidate[] | null>(null)

  useEffect(() => {
    if (!banner || banner.tone !== 'success') return
    const t = window.setTimeout(() => setBanner(null), 6000)
    return () => window.clearTimeout(t)
  }, [banner])

  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === 'pending').length,
    [rows]
  )

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await listBrandWaitlistApplicationsAction()
      if (!res.ok) {
        setError(res.error ?? 'Couldn’t refresh the queue.')
        return
      }
      setRows(res.rows ?? [])
      setHasMore(Boolean(res.hasMore))
      setCursor(res.nextCursor ?? null)
      setError(null)
    } catch {
      setError(REACH_SERVER)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await listBrandWaitlistApplicationsAction({ cursor })
      if (!res.ok) {
        setError(res.error ?? 'Couldn’t load more.')
        return
      }
      setRows((prev) =>
        sortApplicationsForQueue([
          ...prev,
          ...(res.rows ?? []).filter((r) => !prev.some((p) => p.waitlist_id === r.waitlist_id)),
        ])
      )
      setHasMore(Boolean(res.hasMore))
      setCursor(res.nextCursor ?? null)
    } catch {
      setError(REACH_SERVER)
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, loadingMore])

  const closeDialog = useCallback(() => {
    if (busyId) return
    setDialog(null)
    setDialogError(null)
    setCandidateOverride(null)
  }, [busyId])

  const runDecision = useCallback(
    async (
      row: BrandApplication,
      input: Parameters<typeof decideBrandApplicationAction>[0]
    ) => {
      setBusyId(row.waitlist_id)
      setDialogError(null)
      setError(null)
      try {
        const res = await decideBrandApplicationAction(input)

        if (res.code === 'possible_duplicate' && res.candidates && res.candidates.length > 0) {
          setCandidateOverride(res.candidates)
          setDialogError(
            res.error ??
              'This may already be in the catalog. Pick the brand to link, or choose Create new brand.'
          )
          return
        }

        if (!res.ok) {
          if (res.closeAndRefresh) {
            setBanner({
              message: res.error ?? 'Couldn’t complete the review. Refresh to see where it stands.',
              tone: res.tone ?? 'info',
            })
            setDialog(null)
            setCandidateOverride(null)
            void refresh()
            return
          }
          setDialogError(res.error ?? 'Couldn’t complete the review. Try again.')
          return
        }

        setDialog(null)
        setCandidateOverride(null)

        if (input.action === 'approve' || input.action === 'resend') {
          if (res.sent === true) {
            setBanner({
              message: `Invite sent to ${res.invited_email ?? row.contact_email}.`,
              tone: 'success',
            })
          } else if (res.sent === false) {
            setBanner({
              message: 'Approved, but the invite email didn’t send. Use Resend.',
              tone: 'warn',
              detail: res.send_error ?? null,
            })
          } else {
            setBanner({
              message: `Invite saved for ${res.invited_email ?? row.contact_email}.`,
              tone: 'success',
            })
          }
        } else if (input.action === 'reject') {
          if (res.sent === true) {
            setBanner({ message: 'Rejected. Reply sent.', tone: 'success' })
          } else if (res.sent === false) {
            setBanner({
              message: 'Rejected, but the reply email didn’t send.',
              tone: 'warn',
            })
          } else {
            setBanner({ message: 'Rejected. No reply sent.', tone: 'success' })
          }
        } else if (res.revoked === 0) {
          setBanner({ message: 'No pending invite to revoke.', tone: 'info' })
        } else {
          setBanner({ message: 'Invite revoked.', tone: 'success' })
        }
        void refresh()
      } catch {
        setBanner({ message: REACH_SERVER, tone: 'error' })
        setDialogError(REACH_SERVER)
      } finally {
        setBusyId(null)
      }
    },
    [refresh]
  )

  const submitApprove = useCallback(
    (row: BrandApplication, input: ApproveSubmit) => {
      void runDecision(row, {
        action: 'approve',
        waitlistId: row.waitlist_id,
        brandName: input.brandName,
        existingBrandId: input.existingBrandId,
        confirmNew: input.confirmNew,
        reviewNotes: input.reviewNotes,
      })
    },
    [runDecision]
  )

  return {
    rows,
    hasMore,
    loadingMore,
    error,
    banner,
    setBanner,
    refreshing,
    busyId,
    dialog,
    setDialog,
    dialogError,
    setDialogError,
    candidateOverride,
    setCandidateOverride,
    pendingCount,
    refresh,
    loadMore,
    closeDialog,
    runDecision,
    submitApprove,
  }
}
