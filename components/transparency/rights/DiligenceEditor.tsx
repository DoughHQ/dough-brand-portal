import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import {
  composeDiligenceLine,
  provenanceWhisperFromTier,
} from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import { disclosedText, patchShared } from './helpers'
import ProvenanceFields from './ProvenanceFields'
import type { RightsChangeHandler, RightsLocalRow } from './types'

export default function DiligenceEditor({
  canEdit,
  saving,
  diligenceField,
  geoField,
  remediationField,
  diligenceRow,
  geoRow,
  remediationRow,
  onChange,
  onSave,
  onClearError,
}: {
  canEdit: boolean
  saving: boolean
  diligenceField?: ProofSubMetricRow
  geoField?: ProofSubMetricRow
  remediationField?: ProofSubMetricRow
  diligenceRow?: RightsLocalRow
  geoRow?: RightsLocalRow
  remediationRow?: RightsLocalRow
  onChange: RightsChangeHandler
  onSave: () => void
  onClearError?: () => void
}) {
  const line = composeDiligenceLine({
    step: disclosedText(diligenceRow),
    geography: disclosedText(geoRow),
    remediation: disclosedText(remediationRow),
  })
  const anchor = diligenceRow?.draft ?? geoRow?.draft ?? remediationRow?.draft
  const presence = rowPresence(anchor ?? null)
  const canSave = Boolean(
    disclosedText(diligenceRow) || disclosedText(geoRow) || disclosedText(remediationRow),
  )
  const shared = [
    diligenceField && diligenceRow ? { field: diligenceField, row: diligenceRow } : null,
    geoField && geoRow ? { field: geoField, row: geoRow } : null,
    remediationField && remediationRow
      ? { field: remediationField, row: remediationRow }
      : null,
  ]

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">Human rights diligence</p>
          <p className="tx-ops__card-hint">
            One OECD-aligned step, plus how you handle high-risk geographies and remediation.
          </p>
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
      {diligenceField && diligenceRow ? (
        <div className="tx-field">
          <div className="tx-label">Due-diligence step</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={diligenceRow.draft.valueText ?? ''}
            onChange={(e) => {
              onClearError?.()
              onChange(diligenceField.sub_metric_code, diligenceRow.key, {
                ...diligenceRow.draft,
                status: 'disclosed',
                valueText: e.target.value || null,
              })
            }}
          >
            <option value="">Select…</option>
            {(diligenceField.allowed_values ?? []).map((code) => (
              <option key={code} value={code}>
                {formatProofCode(code)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {geoField && geoRow ? (
        <div className="tx-field">
          <div className="tx-label">High-risk geography policy</div>
          <textarea
            className="tx-control"
            rows={2}
            disabled={!canEdit}
            placeholder="In your own words…"
            value={geoRow.draft.valueText ?? ''}
            onChange={(e) => {
              onClearError?.()
              onChange(geoField.sub_metric_code, geoRow.key, {
                ...geoRow.draft,
                status: 'disclosed',
                valueText: e.target.value || null,
              })
            }}
          />
        </div>
      ) : null}
      {remediationField && remediationRow ? (
        <div className="tx-field">
          <div className="tx-label">Remediation stance</div>
          <textarea
            className="tx-control"
            rows={2}
            disabled={!canEdit}
            placeholder="What you commit to when a violation is found…"
            value={remediationRow.draft.valueText ?? ''}
            onChange={(e) => {
              onClearError?.()
              onChange(remediationField.sub_metric_code, remediationRow.key, {
                ...remediationRow.draft,
                status: 'disclosed',
                valueText: e.target.value || null,
              })
            }}
          />
        </div>
      ) : null}
      <ProvenanceFields
        name="rights-diligence-tier"
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
            {saving ? 'Saving…' : 'Save diligence'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
