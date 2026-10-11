import type { AddAvailability } from '@/lib/concept/fieldSize'

export default function CompetitorColumnHead({
  singleTestMode,
  showAdd,
  adding,
  disabled,
  addAvailability,
  progressLabel,
  onOpenAdd,
}: {
  singleTestMode: boolean
  showAdd: boolean
  adding: boolean
  disabled?: boolean
  addAvailability: AddAvailability
  progressLabel: string
  onOpenAdd: () => void
}) {
  return (
    <div className="cb-field-head-right">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <div className="cb-field-col-title">
            {singleTestMode ? 'Competitive set' : 'Competitors'}
          </div>
          <div className="cb-field-col-meta">
            {singleTestMode
              ? 'The products they face.'
              : 'Add the real products shoppers would compare yours against.'}
          </div>
        </div>
        {showAdd ? (
          <button
            type="button"
            onClick={onOpenAdd}
            className="cb-btn-outline"
            disabled={disabled || adding || !addAvailability.allowed}
            aria-describedby={addAvailability.allowed ? undefined : 'cb-add-competitor-reason'}
          >
            + Add competitor
          </button>
        ) : null}
      </div>
      {singleTestMode && /^\d+ competitors? added$/.test(progressLabel) ? null : (
        <p
          role="status"
          style={{ margin: 0, fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}
        >
          {progressLabel}
        </p>
      )}
      {!addAvailability.allowed && showAdd ? (
        <p
          id="cb-add-competitor-reason"
          style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.45 }}
        >
          {addAvailability.message}
        </p>
      ) : null}
    </div>
  )
}
