import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import type {
  OperationsEditorHandlers,
  OpsLocalRow,
} from '@/components/transparency/operations/types'

type Props = {
  title: string
  hint: string
  field: ProofSubMetricRow
  row: OpsLocalRow | undefined
  canEdit: boolean
  saving: boolean
  error: string | null
  onChange: OperationsEditorHandlers['onChange']
  onSave: OperationsEditorHandlers['onSaveRow']
}

export default function WholeEnumCard({
  title,
  hint,
  field,
  row,
  canEdit,
  saving,
  error,
  onChange,
  onSave,
}: Props) {
  if (!row) return null
  const presence = rowPresence(row.draft)
  const summary = row.draft.valueText ? formatProofCode(row.draft.valueText) : '—'

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">{title}</p>
          <p className="tx-ops__card-hint">{hint}</p>
        </div>
        <span className={presencePillClass(presence)}>{presenceLabel(presence)}</span>
      </div>
      <p className="tx-ops__card-summary">{summary}</p>
      <div className="tx-field">
        <div className="tx-label">Value</div>
        <select
          className="tx-control"
          disabled={!canEdit}
          value={row.draft.valueText ?? ''}
          onChange={(e) =>
            onChange(field.sub_metric_code, row.key, {
              ...row.draft,
              status: 'disclosed',
              valueText: e.target.value || null,
            })
          }
        >
          <option value="">Select…</option>
          {(field.allowed_values ?? []).map((code) => (
            <option key={code} value={code}>
              {formatProofCode(code)}
            </option>
          ))}
        </select>
      </div>
      <label className="tx-publish" style={{ marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={row.draft.published}
          disabled={!canEdit}
          onChange={(e) =>
            onChange(field.sub_metric_code, row.key, {
              ...row.draft,
              published: e.target.checked,
            })
          }
        />
        <span>
          <span className="tx-publish__label">Show to shoppers</span>
        </span>
      </label>
      <div className="tx-field">
        <div className="tx-label">As of</div>
        <input
          type="date"
          className="tx-control tx-control--date"
          disabled={!canEdit}
          value={row.draft.asofDate}
          onChange={(e) =>
            onChange(field.sub_metric_code, row.key, {
              ...row.draft,
              asofDate: e.target.value,
            })
          }
        />
      </div>
      {canEdit ? (
        <button
          type="button"
          className="tx-btn tx-btn--primary"
          disabled={saving || !row.draft.valueText}
          onClick={() => onSave(field, row)}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      ) : null}
      {error ? <p className="tx-error">{error}</p> : null}
    </div>
  )
}
