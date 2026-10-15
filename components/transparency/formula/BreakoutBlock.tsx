import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import type { FormulaLocalRow } from './formulaModel'

export function BreakoutBlock({
  field,
  subject,
  row,
  canEdit,
  saving,
  error,
  onEnsureRow,
  onChange,
  onSave,
}: {
  field: ProofSubMetricRow
  subject: string
  row: FormulaLocalRow | undefined
  canEdit: boolean
  saving: boolean
  error: string | null
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onSave: (field: ProofSubMetricRow, row: FormulaLocalRow) => void
}) {
  const patch = (partial: Partial<DisclosureDraft>) => {
    let key = row?.key
    let base = row?.draft
    if (!key || !base) {
      key = onEnsureRow(field, subject)
      base = blankDraft(field, {
        subjectKind: 'ingredient',
        subjectLabel: subject,
        status: 'disclosed',
      })
    }
    onChange(field.sub_metric_code, key, {
      ...base,
      subjectKind: 'ingredient',
      subjectLabel: subject,
      ...partial,
    })
  }

  return (
    <div className="tx-formula__block">
      <p className="tx-formula__block-title">What’s inside?</p>
      <p className="tx-formula__block-hint">
        Break out <strong>{subject}</strong> when it’s a blend the label doesn’t fully explain.
      </p>
      <textarea
        className="tx-control tx-formula__textarea"
        rows={3}
        disabled={!canEdit}
        placeholder="e.g. orange oil, vanilla extract"
        value={row?.draft.valueText ?? ''}
        onChange={(e) =>
          patch({ status: 'disclosed', valueText: e.target.value || null })
        }
      />
      {row ? (
        <>
          <label className="tx-publish" style={{ margin: '12px 0' }}>
            <input
              type="checkbox"
              checked={row.draft.published}
              disabled={!canEdit}
              onChange={(e) => patch({ published: e.target.checked })}
            />
            <span>
              <span className="tx-publish__label">Show breakout to shoppers</span>
            </span>
          </label>
          <div className="tx-field">
            <div className="tx-label">As of</div>
            <input
              type="date"
              className="tx-control tx-control--date"
              disabled={!canEdit}
              value={row.draft.asofDate}
              onChange={(e) => patch({ asofDate: e.target.value })}
            />
          </div>
          {canEdit ? (
            <button
              type="button"
              className="tx-btn tx-btn--primary"
              disabled={saving || !row.draft.valueText?.trim()}
              onClick={() => onSave(field, row)}
            >
              {saving ? 'Saving…' : 'Save breakout'}
            </button>
          ) : null}
          {error ? <p className="tx-error">{error}</p> : null}
        </>
      ) : null}
    </div>
  )
}
