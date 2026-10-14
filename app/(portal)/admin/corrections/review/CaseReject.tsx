import { REJECT_CHIPS } from './caseStageModel'

export function CaseReject({
  rejectChip,
  busy,
  onPickReject,
  onReject,
}: {
  rejectChip: string | null
  busy: boolean
  onPickReject: (chip: string) => void
  onReject: () => void
}) {
  return (
    <details className="corr-reject">
      <summary>This report is wrong</summary>
      <div className="corr-reject-body">
        {REJECT_CHIPS.map((chip) => {
          const selected = rejectChip === chip
          return (
            <button
              key={chip}
              type="button"
              className={selected ? 'corr-chip corr-chip-on' : 'corr-chip'}
              onClick={() => onPickReject(chip)}
            >
              {chip}
            </button>
          )
        })}
        <button
          type="button"
          className="corr-reject-go"
          disabled={busy || !rejectChip}
          onClick={onReject}
        >
          Reject
        </button>
      </div>
    </details>
  )
}
