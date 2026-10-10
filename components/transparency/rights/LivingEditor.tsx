import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import {
  composeLivingLine,
  provenanceWhisperFromTier,
} from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import { disclosedText, patchShared } from './helpers'
import ProvenanceFields from './ProvenanceFields'
import type { RightsChangeHandler, RightsLocalRow } from './types'

export default function LivingEditor({
  canEdit,
  saving,
  welfareField,
  antibioticField,
  welfareRow,
  antibioticRow,
  onChange,
  onSave,
  onClearError,
}: {
  canEdit: boolean
  saving: boolean
  welfareField?: ProofSubMetricRow
  antibioticField?: ProofSubMetricRow
  welfareRow?: RightsLocalRow
  antibioticRow?: RightsLocalRow
  onChange: RightsChangeHandler
  onSave: () => void
  onClearError?: () => void
}) {
  const line = composeLivingLine({
    welfare: disclosedText(welfareRow),
    antibiotics: disclosedText(antibioticRow),
  })
  const anchor = welfareRow?.draft ?? antibioticRow?.draft
  const presence = rowPresence(anchor ?? null)
  const canSave = Boolean(disclosedText(welfareRow) || disclosedText(antibioticRow))
  const shared = [
    welfareField && welfareRow ? { field: welfareField, row: welfareRow } : null,
    antibioticField && antibioticRow ? { field: antibioticField, row: antibioticRow } : null,
  ]

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">Animal care claim</p>
          <p className="tx-ops__card-hint">Skip entirely if this product has no animal inputs.</p>
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
        {welfareField && welfareRow ? (
          <div className="tx-field">
            <div className="tx-label">Welfare standard</div>
            <select
              className="tx-control"
              disabled={!canEdit}
              value={welfareRow.draft.valueText ?? ''}
              onChange={(e) => {
                onClearError?.()
                onChange(welfareField.sub_metric_code, welfareRow.key, {
                  ...welfareRow.draft,
                  status: 'disclosed',
                  valueText: e.target.value || null,
                })
              }}
            >
              <option value="">Select…</option>
              {(welfareField.allowed_values ?? []).map((code) => (
                <option key={code} value={code}>
                  {formatProofCode(code)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {antibioticField && antibioticRow ? (
          <div className="tx-field">
            <div className="tx-label">Antibiotic / hormone policy</div>
            <select
              className="tx-control"
              disabled={!canEdit}
              value={antibioticRow.draft.valueText ?? ''}
              onChange={(e) => {
                onClearError?.()
                onChange(antibioticField.sub_metric_code, antibioticRow.key, {
                  ...antibioticRow.draft,
                  status: 'disclosed',
                  valueText: e.target.value || null,
                })
              }}
            >
              <option value="">Select…</option>
              {(antibioticField.allowed_values ?? []).map((code) => (
                <option key={code} value={code}>
                  {formatProofCode(code)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <ProvenanceFields
        name="rights-living-tier"
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
            {saving ? 'Saving…' : 'Save living things'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
