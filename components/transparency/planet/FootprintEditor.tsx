import { type DisclosureDraft, type ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode, formatUnitSuffix } from '@/lib/transparency/displayMap'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import { composePcfLine, provenanceWhisperFromTier } from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import { type PlanetLocalRow, type Props, SOURCE_TIERS } from './planetModel'

export function FootprintEditor({
  pcfField,
  assuranceField,
  pcfRow,
  assuranceRow,
  canEdit,
  saving,
  onChange,
  onSave,
  onClearError,
}: {
  pcfField: ProofSubMetricRow
  assuranceField: ProofSubMetricRow | null
  pcfRow: PlanetLocalRow
  assuranceRow: PlanetLocalRow | undefined
  canEdit: boolean
  saving: boolean
  onChange: Props['onChange']
  onSave: () => void
  onClearError?: () => void
}) {
  const patchPcf = (partial: Partial<DisclosureDraft>) => {
    onClearError?.()
    onChange(pcfField.sub_metric_code, pcfRow.key, {
      ...pcfRow.draft,
      status: 'disclosed',
      ...partial,
    })
  }

  const patchShared = (partial: Partial<DisclosureDraft>) => {
    onClearError?.()
    patchPcf(partial)
    if (assuranceField && assuranceRow) {
      onChange(assuranceField.sub_metric_code, assuranceRow.key, {
        ...assuranceRow.draft,
        ...partial,
      })
    }
  }

  const preview = composePcfLine({
    valueNum: pcfRow.draft.valueNum,
    valueUnit: pcfRow.draft.valueUnit ?? pcfField.unit,
    boundaryCode: pcfRow.draft.boundaryCode,
    methodCode: pcfRow.draft.methodCode,
    dataQuality: pcfRow.draft.dataQuality,
  })
  const whisper = provenanceWhisperFromTier({
    status: 'disclosed',
    sourceTier: pcfRow.draft.sourceTier,
    issuerName: pcfRow.draft.issuerName,
  })
  const presence = rowPresence(pcfRow.draft)
  const units = pcfField.allowed_units?.length
    ? pcfField.allowed_units
    : ['kgCO2e_per_kg', 'kgCO2e_per_serving']

  const provClass =
    pcfRow.draft.sourceTier === 'third_party_verified'
      ? 'tx-prov tx-prov--verified'
      : pcfRow.draft.sourceTier === 'brand_document'
        ? 'tx-prov tx-prov--document'
        : 'tx-prov tx-prov--stated'

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <span className={presencePillClass(presence)}>{presenceLabel(presence)}</span>
      </div>
      <ShopperPreview line={preview} whisper={whisper} />

      <div className="tx-field">
        <div className="tx-label">Footprint</div>
        <div className="tx-inline">
          <input
            type="number"
            step="any"
            className="tx-control"
            disabled={!canEdit}
            value={pcfRow.draft.valueNum ?? ''}
            onChange={(e) =>
              patchPcf({
                valueNum: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
          <select
            className="tx-control"
            disabled={!canEdit}
            value={pcfRow.draft.valueUnit ?? units[0] ?? ''}
            onChange={(e) => patchPcf({ valueUnit: e.target.value || null })}
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {formatUnitSuffix(u) || formatProofCode(u)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pcfField.requires_boundary ? (
        <div className="tx-field">
          <div className="tx-label">Boundary</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={pcfRow.draft.boundaryCode ?? ''}
            onChange={(e) => patchPcf({ boundaryCode: e.target.value || null })}
          >
            <option value="">Select…</option>
            {(pcfField.allowed_boundaries ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {pcfField.requires_method ? (
        <div className="tx-field">
          <div className="tx-label">Method</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={pcfRow.draft.methodCode ?? ''}
            onChange={(e) => patchPcf({ methodCode: e.target.value || null })}
          >
            <option value="">Select…</option>
            {(pcfField.allowed_methods ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {pcfField.requires_data_quality ? (
        <div className="tx-field">
          <div className="tx-label">Data quality</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={pcfRow.draft.dataQuality ?? ''}
            onChange={(e) => patchPcf({ dataQuality: e.target.value || null })}
          >
            <option value="">Select…</option>
            {(pcfField.allowed_data_qualities ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {assuranceField && assuranceRow ? (
        <div className="tx-field">
          <div className="tx-label">Assurance</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={assuranceRow.draft.valueText ?? ''}
            onChange={(e) =>
              onChange(assuranceField.sub_metric_code, assuranceRow.key, {
                ...assuranceRow.draft,
                status: 'disclosed',
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(assuranceField.allowed_values ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div key={pcfRow.draft.sourceTier} className={provClass}>
        <p className="tx-prov__eyebrow">How you know</p>
        <div className="tx-tiers">
          {SOURCE_TIERS.map((tier) => (
            <label
              key={tier.value}
              className={`tx-tier${
                pcfRow.draft.sourceTier === tier.value ? ' tx-tier--active' : ''
              }${!canEdit ? ' tx-tier--disabled' : ''}`}
            >
              <input
                type="radio"
                name="planet-pcf-tier"
                checked={pcfRow.draft.sourceTier === tier.value}
                disabled={!canEdit}
                onChange={() =>
                  patchShared({
                    sourceTier: tier.value,
                    sourceUrl:
                      tier.value === 'brand_stated' ? null : pcfRow.draft.sourceUrl,
                    issuerName:
                      tier.value === 'third_party_verified'
                        ? pcfRow.draft.issuerName
                        : null,
                    credentialId:
                      tier.value === 'third_party_verified'
                        ? pcfRow.draft.credentialId
                        : null,
                  })
                }
              />
              <span>
                <span className="tx-tier__name">{tier.label}</span>
                <span className="tx-tier__hint">{tier.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {pcfRow.draft.sourceTier !== 'brand_stated' ? (
          <div className="tx-field">
            <div className="tx-label">Source URL</div>
            <input
              type="url"
              className="tx-control"
              disabled={!canEdit}
              placeholder="https://"
              value={pcfRow.draft.sourceUrl ?? ''}
              onChange={(e) => patchShared({ sourceUrl: e.target.value || null })}
            />
          </div>
        ) : null}
        {pcfRow.draft.sourceTier === 'third_party_verified' ? (
          <div className="tx-field">
            <div className="tx-grid tx-grid--2">
              <div>
                <div className="tx-label">Issuer</div>
                <input
                  className="tx-control"
                  disabled={!canEdit}
                  value={pcfRow.draft.issuerName ?? ''}
                  onChange={(e) => patchShared({ issuerName: e.target.value || null })}
                />
              </div>
              <div>
                <div className="tx-label">Credential ID</div>
                <input
                  className="tx-control"
                  disabled={!canEdit}
                  value={pcfRow.draft.credentialId ?? ''}
                  onChange={(e) =>
                    patchShared({ credentialId: e.target.value || null })
                  }
                />
              </div>
            </div>
          </div>
        ) : null}
        <div className="tx-field">
          <div className="tx-label">As of</div>
          <input
            type="date"
            className="tx-control tx-control--date"
            disabled={!canEdit}
            value={pcfRow.draft.asofDate}
            onChange={(e) => patchShared({ asofDate: e.target.value })}
          />
        </div>
      </div>

      <div className="tx-footer" style={{ marginTop: 0 }}>
        <label className="tx-publish">
          <input
            type="checkbox"
            checked={pcfRow.draft.published}
            disabled={!canEdit || pcfRow.draft.valueNum == null}
            onChange={(e) => patchShared({ published: e.target.checked })}
          />
          <span>
            <span className="tx-publish__label">Show this claim to shoppers</span>
          </span>
        </label>
        {canEdit ? (
          <button
            type="button"
            className="tx-btn tx-btn--primary"
            disabled={saving || pcfRow.draft.valueNum == null}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save footprint'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
