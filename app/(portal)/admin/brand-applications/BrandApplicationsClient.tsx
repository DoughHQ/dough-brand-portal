'use client'

import {
  type BrandApplication,
  type BrandApplicationsPageCursor,
} from '@/lib/brandApplications'
import {
  ApproveInviteDialog,
  ConfirmDialog,
  RejectDialog,
} from './ApplicationDecisionDialogs'
import BrandApplicationCard from './queue/BrandApplicationCard'
import { ApplicationQueueBanner } from './queue/ApplicationQueueBanner'
import { ApplicationQueueEmpty } from './queue/ApplicationQueueEmpty'
import { ApplicationQueueError } from './queue/ApplicationQueueError'
import { ApplicationQueueHeader } from './queue/ApplicationQueueHeader'
import { ApplicationQueueImpersonation } from './queue/ApplicationQueueImpersonation'
import { ApplicationQueueLoadMore } from './queue/ApplicationQueueLoadMore'
import { useBrandApplicationQueue } from './queue/useBrandApplicationQueue'

export default function BrandApplicationsClient({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  initialError,
  impersonating = false,
}: {
  initialRows: BrandApplication[]
  initialHasMore?: boolean
  initialCursor?: BrandApplicationsPageCursor | null
  initialError?: string | null
  /** True when the access token carries any impersonated_brand_id claim. */
  impersonating?: boolean
}) {
  const {
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
  } = useBrandApplicationQueue({
    initialRows,
    initialHasMore,
    initialCursor,
    initialError,
  })

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 1100,
        margin: '0 auto',
        padding: '36px 32px 96px',
      }}
    >
      <ApplicationQueueHeader
        pendingCount={pendingCount}
        total={rows.length}
        refreshing={refreshing}
        refresh={refresh}
      />

      <ApplicationQueueImpersonation impersonating={impersonating} />

      <ApplicationQueueBanner banner={banner} setBanner={setBanner} />

      <ApplicationQueueError error={error} />

      {rows.length === 0 ? (
        <ApplicationQueueEmpty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rows.map((row) => (
            <BrandApplicationCard
              key={row.waitlist_id}
              row={row}
              impersonating={impersonating}
              busy={busyId === row.waitlist_id}
              setDialog={setDialog}
              setDialogError={setDialogError}
              setCandidateOverride={setCandidateOverride}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <ApplicationQueueLoadMore loading={loadingMore} loadMore={loadMore} />
      ) : null}

      {dialog?.kind === 'approve' ? (
        <ApproveInviteDialog
          row={dialog.row}
          busy={busyId === dialog.row.waitlist_id}
          error={dialogError}
          candidateOverride={candidateOverride}
          onClose={closeDialog}
          onSubmit={(input) => submitApprove(dialog.row, input)}
        />
      ) : null}
      {dialog?.kind === 'reject' ? (
        <RejectDialog
          row={dialog.row}
          busy={busyId === dialog.row.waitlist_id}
          error={dialogError}
          onClose={closeDialog}
          onSubmit={(input) =>
            void runDecision(dialog.row, {
              action: 'reject',
              waitlistId: dialog.row.waitlist_id,
              reviewNotes: input.reviewNotes,
              sendEmail: input.sendEmail,
            })
          }
        />
      ) : null}
      {dialog?.kind === 'resend' ? (
        <ConfirmDialog
          title="Resend invite"
          body={`Send a new link to ${dialog.row.contact_email}? The old link stops working.`}
          primaryLabel="Resend invite"
          busy={busyId === dialog.row.waitlist_id}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={() =>
            void runDecision(dialog.row, {
              action: 'resend',
              waitlistId: dialog.row.waitlist_id,
            })
          }
        />
      ) : null}
      {dialog?.kind === 'revoke' ? (
        <ConfirmDialog
          title="Revoke invite"
          body={`Revoke the invite for ${dialog.row.contact_email}? The link stops working.`}
          primaryLabel="Revoke"
          busy={busyId === dialog.row.waitlist_id}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={() =>
            void runDecision(dialog.row, {
              action: 'revoke',
              waitlistId: dialog.row.waitlist_id,
            })
          }
        />
      ) : null}
    </div>
  )
}
