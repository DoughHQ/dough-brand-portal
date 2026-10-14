import type { OperatorStudyRow } from '@/lib/studies/types'
import ConfirmDialog from '../ConfirmDialog'

function inFlightEstimate(row: OperatorStudyRow): number {
  return Math.max(0, row.total_claims - row.completed_claims)
}

type Props = {
  row: OperatorStudyRow | null
  busy: boolean
  onCancel: () => void
  onConfirm: (row: OperatorStudyRow) => void
}

export default function CloseStudyConfirm({ row, busy, onCancel, onConfirm }: Props) {
  return (
    <ConfirmDialog
      open={row != null}
      title="Close study?"
      body={
        row != null ? (
          inFlightEstimate(row) > 0 ? (
            <>
              This will stop up to{' '}
              <strong>{inFlightEstimate(row)}</strong> in-progress
              respondent
              {inFlightEstimate(row) === 1 ? '' : 's'} for “
              {row.title}”.
            </>
          ) : (
            <>“{row.title}” will mark as completed.</>
          )
        ) : null
      }
      confirmLabel="Close study"
      tone="caution"
      busy={busy}
      onCancel={onCancel}
      onConfirm={() => {
        if (row != null) void onConfirm(row)
      }}
    />
  )
}
