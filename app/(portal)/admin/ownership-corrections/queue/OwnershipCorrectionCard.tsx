import type { Dispatch, SetStateAction } from 'react'
import type { PendingOwnershipCorrection } from '@/lib/ownershipCorrections'
import { OwnershipCorrectionBody } from './OwnershipCorrectionBody'
import { OwnershipCorrectionHeading } from './OwnershipCorrectionHeading'
import { OwnershipDecisionActions } from './OwnershipDecisionActions'
import { OwnershipReviewNotes } from './OwnershipReviewNotes'
import { OwnershipStaleConfirm } from './OwnershipStaleConfirm'

export function OwnershipCorrectionCard({
  row,
  busyId,
  liveNames,
  notesById,
  setNotesById,
  staleConfirmId,
  setStaleConfirmId,
  decide,
  onAcceptClick,
}: {
  row: PendingOwnershipCorrection
  busyId: string | null
  liveNames: Map<number, string>
  notesById: Record<string, string>
  setNotesById: Dispatch<SetStateAction<Record<string, string>>>
  staleConfirmId: string | null
  setStaleConfirmId: Dispatch<SetStateAction<string | null>>
  decide: (
    row: PendingOwnershipCorrection,
    decision: 'accept' | 'reject',
    overrideStale: boolean,
  ) => void
  onAcceptClick: (row: PendingOwnershipCorrection) => void
}) {
  const busy = busyId === row.correction_id
  const confirmingStale = staleConfirmId === row.correction_id

  return (
    <article
      style={{
        background: 'var(--paper)',
        border: `1px solid ${row.snapshot_is_stale ? 'rgba(192,120,24,0.45)' : 'var(--ink-10)'}`,
        borderRadius: 12,
        padding: '20px 22px',
      }}
    >
      <OwnershipCorrectionHeading row={row} />
      <OwnershipCorrectionBody row={row} liveNames={liveNames} />
      <OwnershipReviewNotes
        row={row}
        notesById={notesById}
        setNotesById={setNotesById}
        busy={busy}
      />
      <OwnershipStaleConfirm
        row={row}
        busy={busy}
        confirmingStale={confirmingStale}
        setStaleConfirmId={setStaleConfirmId}
        decide={decide}
      />
      <OwnershipDecisionActions
        row={row}
        busy={busy}
        confirmingStale={confirmingStale}
        onAcceptClick={onAcceptClick}
        decide={decide}
      />
    </article>
  )
}
