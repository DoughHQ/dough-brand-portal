import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import { composeFormulaLine } from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import type { FormulaLocalRow } from './formulaModel'

export function AmountBlock({
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
      <p className="tx-formula__block-title">How much?</p>
      <p className="tx-formula__block-hint">
        Percentage of <strong>{subject}</strong> in the formula. Optional — only disclose what
        you want shoppers to see.
      </p>
      <ShopperPreview
        line={
          row?.draft.valueNum != null
            ? composeFormulaLine({ subject, percent: row.draft.valueNum })
            : ''
        }
      />
      <div className="tx-inline" style={{ marginBottom: 12, maxWidth: 220 }}>
        <input
          type="number"
          step="any"
          min={0}
          max={100}
          className="tx-control"
          disabled={!canEdit}
          placeholder="0"
          value={row?.draft.valueNum ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? null : Number(e.target.value)
            patch({ status: 'disclosed', valueNum: v, valueUnit: null })
          }}
        />
        <span className="tx-unit">%</span>
      </div>
      {row ? (
        <>
          <label className="tx-publish" style={{ marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={row.draft.published}
              disabled={!canEdit}
              onChange={(e) => patch({ published: e.target.checked })}
            />
            <span>
              <span className="tx-publish__label">Show amount to shoppers</span>
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
              disabled={saving || row.draft.valueNum == null}
              onClick={() => onSave(field, row)}
            >
              {saving ? 'Saving…' : 'Save amount'}
            </button>
          ) : null}
          {error ? <p className="tx-error">{error}</p> : null}
        </>
      ) : (
        <p className="tx-formula__block-hint">Type a percentage to create a disclosure.</p>
      )}
    </div>
  )
}
