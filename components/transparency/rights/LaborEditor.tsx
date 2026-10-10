import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import {
  composeLaborLine,
  provenanceWhisperFromTier,
} from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import { disclosedText, patchShared } from './helpers'
import ProvenanceFields from './ProvenanceFields'
import type { RightsChangeHandler, RightsLocalRow } from './types'

export default function LaborEditor({
  canEdit,
  saving,
  laborField,
  scopeField,
  laborRow,
  scopeRow,
  onChange,
  onSave,
  onClearError,
}: {
  canEdit: boolean
  saving: boolean
  laborField?: ProofSubMetricRow
  scopeField?: ProofSubMetricRow
  laborRow?: RightsLocalRow
  scopeRow?: RightsLocalRow
  onChange: RightsChangeHandler
  onSave: () => void
  onClearError?: () => void
}) {
  const line = composeLaborLine({
    standard: disclosedText(laborRow),
    scope: disclosedText(scopeRow),
  })
  const anchor = laborRow?.draft ?? scopeRow?.draft
  const presence = rowPresence(anchor ?? null)
  const canSave = Boolean(disclosedText(laborRow) || disclosedText(scopeRow))
  const shared = [
    laborField && laborRow ? { field: laborField, row: laborRow } : null,
    scopeField && scopeRow ? { field: scopeField, row: scopeRow } : null,
  ]

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">Labor code</p>
          <p className="tx-ops__card-hint">What you align to, and how far down the chain it reaches.</p>
        </div>
        <span className={presencePillClass(presence)}>{presenceLabel(presence)}</span>
      </div>
      <ShopperPreview
        line={line}
        whisper={provenanceWhisperFromTier({
          status: anchor?.status,
          sourceTier: anchor?.sourceTier,
          issuerName: anchor?.issuerName,
        })}
      />
      <div className="tx-grid tx-grid--2">
        {laborField && laborRow ? (
          <div className="tx-field">
            <div className="tx-label">Labor standard</div>
            <select
              className="tx-control"
              disabled={!canEdit}
              value={laborRow.draft.valueText ?? ''}
              onChange={(e) => {
                onClearError?.()
                onChange(laborField.sub_metric_code, laborRow.key, {
                  ...laborRow.draft,
                  status: 'disclosed',
                  valueText: e.target.value || null,
                })
              }}
            >
              <option value="">Select…</option>
              {(laborField.allowed_values ?? []).map((code) => (
                <option key={code} value={code}>
                  {formatProofCode(code)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {scopeField && scopeRow ? (
          <div className="tx-field">
            <div className="tx-label">Policy scope</div>
            <select
              className="tx-control"
              disabled={!canEdit}
              value={scopeRow.draft.valueText ?? ''}
              onChange={(e) => {
                onClearError?.()
                onChange(scopeField.sub_metric_code, scopeRow.key, {
                  ...scopeRow.draft,
                  status: 'disclosed',
                  valueText: e.target.value || null,
                })
              }}
            >
              <option value="">Select…</option>
              {(scopeField.allowed_values ?? []).map((code) => (
                <option key={code} value={code}>
                  {formatProofCode(code)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <ProvenanceFields
        name="rights-labor-tier"
        anchor={anchor}
        canEdit={canEdit}
        onPatch={(patch) => patchShared(shared, patch, onChange)}
      />
      <div className="tx-footer" style={{ marginTop: 0 }}>
        <label className="tx-publish">
          <input
            type="checkbox"
            checked={Boolean(anchor?.published)}
            disabled={!canEdit || !canSave}
            onChange={(e) => patchShared(shared, { published: e.target.checked }, onChange)}
          />
          <span>
            <span className="tx-publish__label">Show to shoppers</span>
          </span>
        </label>
        {canEdit ? (
          <button
            type="button"
            className="tx-btn tx-btn--primary"
            disabled={saving || !canSave}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save labor code'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
