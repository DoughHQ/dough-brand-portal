import { type DisclosureDraft } from '@/lib/transparency/disclosures'
import type { OriginLocalRow } from './originModel'

export function CoverageStrip({
  row,
  canEdit,
  saving,
  onChange,
  onSave,
}: {
  row: OriginLocalRow
  canEdit: boolean
  saving: boolean
  onChange: (draft: DisclosureDraft) => void
  onSave: () => void
}) {
  return (
    <div className="tx-origin__coverage">
      <div>
        <p className="tx-origin__coverage-title">Formula coverage</p>
        <p className="tx-origin__coverage-hint">
          Share of the formula by weight for which you’ve stated origin. Whole-product only.
        </p>
      </div>
      <div className="tx-inline" style={{ maxWidth: 200 }}>
        <input
          type="number"
          step="any"
          min={0}
          max={100}
          className="tx-control"
          disabled={!canEdit}
          value={row.draft.valueNum ?? ''}
          onChange={(e) =>
            onChange({
              ...row.draft,
              status: 'disclosed',
              valueNum: e.target.value === '' ? null : Number(e.target.value),
              valueUnit: null,
            })
          }
        />
        <span className="tx-unit">%</span>
      </div>
      {canEdit ? (
        <button
          type="button"
          className="tx-btn tx-btn--primary"
          disabled={saving || row.draft.valueNum == null}
          onClick={onSave}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      ) : null}
    </div>
  )
}
