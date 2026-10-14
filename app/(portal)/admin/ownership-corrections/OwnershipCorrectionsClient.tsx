'use client'

import type { OwnershipCorrectionsPageCursor, PendingOwnershipCorrection } from '@/lib/ownershipCorrections'
import { OwnershipCorrectionCard } from './queue/OwnershipCorrectionCard'
import { OwnershipQueueEmpty } from './queue/OwnershipQueueEmpty'
import { OwnershipQueueHead } from './queue/OwnershipQueueHead'
import { OwnershipQueueLoadMore } from './queue/OwnershipQueueLoadMore'
import { OwnershipQueueNotices } from './queue/OwnershipQueueNotices'
import { useOwnershipCorrections } from './queue/useOwnershipCorrections'

export default function OwnershipCorrectionsClient({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  initialError,
}: {
  initialRows: PendingOwnershipCorrection[]
  initialHasMore?: boolean
  initialCursor?: OwnershipCorrectionsPageCursor | null
  initialError?: string | null
}) {
  const {
    rows,
    hasMore,
    cursor,
    loadingMore,
    error,
    flash,
    busyId,
    notesById,
    setNotesById,
    staleConfirmId,
    setStaleConfirmId,
    liveNames,
    refresh,
    loadMore,
    decide,
    onAcceptClick,
  } = useOwnershipCorrections({
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
      <OwnershipQueueHead refresh={refresh} />
      <OwnershipQueueNotices flash={flash} error={error} />

      {rows.length === 0 ? (
        <OwnershipQueueEmpty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rows.map((row) => (
            <OwnershipCorrectionCard
              key={row.correction_id}
              row={row}
              busyId={busyId}
              liveNames={liveNames}
              notesById={notesById}
              setNotesById={setNotesById}
              staleConfirmId={staleConfirmId}
              setStaleConfirmId={setStaleConfirmId}
              decide={decide}
              onAcceptClick={onAcceptClick}
            />
          ))}
          {hasMore ? (
            <OwnershipQueueLoadMore loadingMore={loadingMore} cursor={cursor} loadMore={loadMore} />
          ) : null}
        </div>
      )}
    </div>
  )
}
