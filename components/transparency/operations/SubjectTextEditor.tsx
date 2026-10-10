import type {
  DisclosureDraft,
  ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import { subjectDisclosureDraft } from '@/lib/transparency/subjectDisclosureDraft'
import type {
  OperationsEditorHandlers,
  OpsLocalRow,
} from '@/components/transparency/operations/types'

type Props = {
  field: ProofSubMetricRow
  subject: string
  row: OpsLocalRow | undefined
  canEdit: boolean
  saving: boolean
  error: string | null
  placeholder: string
  onEnsureRow: OperationsEditorHandlers['onEnsureRow']
  onChange: OperationsEditorHandlers['onChange']
  onSave: OperationsEditorHandlers['onSaveRow']
}

export default function SubjectTextEditor({
  field,
  subject,
  row,
  canEdit,
  saving,
  error,
  placeholder,
  onEnsureRow,
  onChange,
  onSave,
}: Props) {
  const patch = (partial: Partial<DisclosureDraft>) => {
    let key = row?.key
    const current = row?.draft
    if (!key || !current) {
      key = onEnsureRow(field, subject)
    }
    onChange(
      field.sub_metric_code,
      key,
      subjectDisclosureDraft({ field, subject, current, patch: partial })
    )
  }

  return (
    <div className="tx-formula__block">
      <textarea
        className="tx-control tx-formula__textarea"
        rows={3}
        disabled={!canEdit}
        placeholder={placeholder}
        value={row?.draft.valueText ?? ''}
        onChange={(e) => patch({ valueText: e.target.value || null })}
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
              {saving ? 'Saving…' : 'Save'}
            </button>
          ) : null}
          {error ? <p className="tx-error">{error}</p> : null}
        </>
      ) : null}
    </div>
  )
}
