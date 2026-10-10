import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import {
  composeSupplierLine,
  provenanceWhisperFromTier,
} from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import { disclosedNum, disclosedText, patchShared } from './helpers'
import ProvenanceFields from './ProvenanceFields'
import type { RightsChangeHandler, RightsLocalRow } from './types'

export default function SupplierEditor({
  canEdit,
  saving,
  depthField,
  coverageField,
  depthRow,
  coverageRow,
  onChange,
  onSave,
  onClearError,
}: {
  canEdit: boolean
  saving: boolean
  depthField?: ProofSubMetricRow
  coverageField?: ProofSubMetricRow
  depthRow?: RightsLocalRow
  coverageRow?: RightsLocalRow
  onChange: RightsChangeHandler
  onSave: () => void
  onClearError?: () => void
}) {
  const line = composeSupplierLine({
    depth: disclosedText(depthRow),
    coveragePct: disclosedNum(coverageRow),
  })
  const anchor = depthRow?.draft ?? coverageRow?.draft
  const presence = rowPresence(anchor ?? null)
  const canSave = Boolean(disclosedText(depthRow) || disclosedNum(coverageRow) != null)
  const shared = [
    depthField && depthRow ? { field: depthField, row: depthRow } : null,
    coverageField && coverageRow ? { field: coverageField, row: coverageRow } : null,
  ]

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">Supplier list claim</p>
          <p className="tx-ops__card-hint">Depth of naming, and coverage of spend or volume.</p>
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
        {depthField && depthRow ? (
          <div className="tx-field">
            <div className="tx-label">Disclosure depth</div>
            <select
              className="tx-control"
              disabled={!canEdit}
              value={depthRow.draft.valueText ?? ''}
              onChange={(e) => {
                onClearError?.()
                onChange(depthField.sub_metric_code, depthRow.key, {
                  ...depthRow.draft,
                  status: 'disclosed',
                  valueText: e.target.value || null,
                })
              }}
            >
              <option value="">Select…</option>
              {(depthField.allowed_values ?? []).map((code) => (
                <option key={code} value={code}>
                  {formatProofCode(code)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {coverageField && coverageRow ? (
          <div className="tx-field">
            <div className="tx-label">Coverage %</div>
            <input
              type="number"
              className="tx-control"
              disabled={!canEdit}
              min={0}
              max={100}
              step={0.1}
              placeholder="e.g. 80"
              value={coverageRow.draft.valueNum ?? ''}
              onChange={(e) => {
                onClearError?.()
                const raw = e.target.value
                onChange(coverageField.sub_metric_code, coverageRow.key, {
                  ...coverageRow.draft,
                  status: 'disclosed',
                  valueNum: raw === '' ? null : Number(raw),
                  valueUnit: coverageField.unit ?? 'percent',
                })
              }}
            />
          </div>
        ) : null}
      </div>
      <ProvenanceFields
        name="rights-supplier-tier"
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
            {saving ? 'Saving…' : 'Save supplier claim'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
