import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import { provenanceWhisperFromTier } from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import ProvenanceFields from './ProvenanceFields'
import type { RightsChangeHandler, RightsLocalRow } from './types'

export default function SingleEnumCard({
  title,
  hint,
  field,
  row,
  canEdit,
  saving,
  error,
  previewLine,
  onChange,
  onSave,
}: {
  title: string
  hint: string
  field: ProofSubMetricRow
  row: RightsLocalRow
  canEdit: boolean
  saving: boolean
  error: string | null
  previewLine: string
  onChange: RightsChangeHandler
  onSave: () => void
}) {
  const presence = rowPresence(row.draft)
  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">{title}</p>
          <p className="tx-ops__card-hint">{hint}</p>
        </div>
        <span className={presencePillClass(presence)}>{presenceLabel(presence)}</span>
      </div>
      <ShopperPreview
        line={previewLine}
        whisper={provenanceWhisperFromTier({
          status: row.draft.status,
          sourceTier: row.draft.sourceTier,
          issuerName: row.draft.issuerName,
        })}
      />
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
      <ProvenanceFields
        name={`rights-single-${field.sub_metric_code}`}
        anchor={row.draft}
        canEdit={canEdit}
        onPatch={(patch) =>
          onChange(field.sub_metric_code, row.key, { ...row.draft, ...patch })
        }
      />
      <div className="tx-footer" style={{ marginTop: 0 }}>
        <label className="tx-publish">
          <input
            type="checkbox"
            checked={row.draft.published}
            disabled={!canEdit || !row.draft.valueText}
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
        {canEdit ? (
          <button
            type="button"
            className="tx-btn tx-btn--primary"
            disabled={saving || !row.draft.valueText}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : null}
      </div>
      {error ? <p className="tx-error">{error}</p> : null}
    </div>
  )
}
