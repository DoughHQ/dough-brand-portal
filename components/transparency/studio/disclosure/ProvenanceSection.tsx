import type { Props } from './disclosureProps'
import { SOURCE_TIERS } from './disclosureOptions'
import { Label } from './fields'

export function ProvenanceSection({
  field,
  draft,
  canEdit,
  onChange,
}: Pick<Props, 'field' | 'draft' | 'canEdit' | 'onChange'>) {
  const provClass =
    draft.sourceTier === 'third_party_verified'
      ? 'tx-prov tx-prov--verified'
      : draft.sourceTier === 'brand_document'
        ? 'tx-prov tx-prov--document'
        : 'tx-prov tx-prov--stated'

  return (
    <div key={draft.sourceTier} className={provClass}>
      <p className="tx-prov__eyebrow">Provenance</p>
      <Label>Source tier</Label>
      <div className="tx-tiers">
        {SOURCE_TIERS.map((tier) => (
          <label
            key={tier.value}
            className={`tx-tier${
              draft.sourceTier === tier.value ? ' tx-tier--active' : ''
            }${!canEdit ? ' tx-tier--disabled' : ''}`}
          >
            <input
              type="radio"
              name={`tier-${field.sub_metric_code}-${draft.disclosureId ?? 'new'}-${draft.subjectLabel ?? ''}`}
              checked={draft.sourceTier === tier.value}
              disabled={!canEdit}
              onChange={() =>
                onChange({
                  ...draft,
                  sourceTier: tier.value,
                  sourceUrl: tier.value === 'brand_stated' ? null : draft.sourceUrl,
                  issuerName:
                    tier.value === 'third_party_verified' ? draft.issuerName : null,
                  credentialId:
                    tier.value === 'third_party_verified' ? draft.credentialId : null,
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

      {draft.sourceTier !== 'brand_stated' ? (
        <div className="tx-field">
          <Label>Source URL</Label>
          <input
            type="url"
            value={draft.sourceUrl ?? ''}
            disabled={!canEdit}
            placeholder="https://"
            onChange={(e) => onChange({ ...draft, sourceUrl: e.target.value || null })}
            className="tx-control"
          />
        </div>
      ) : null}

      {draft.sourceTier === 'third_party_verified' ? (
        <div className="tx-field">
          <div className="tx-grid tx-grid--2">
            <div>
              <Label>Issuer</Label>
              <input
                value={draft.issuerName ?? ''}
                disabled={!canEdit}
                onChange={(e) =>
                  onChange({ ...draft, issuerName: e.target.value || null })
                }
                className="tx-control"
              />
            </div>
            <div>
              <Label>Credential ID (optional)</Label>
              <input
                value={draft.credentialId ?? ''}
                disabled={!canEdit}
                onChange={(e) =>
                  onChange({ ...draft, credentialId: e.target.value || null })
                }
                className="tx-control"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="tx-field">
        <Label>As of</Label>
        <input
          type="date"
          value={draft.asofDate}
          disabled={!canEdit}
          onChange={(e) => onChange({ ...draft, asofDate: e.target.value })}
          className="tx-control tx-control--date"
        />
      </div>
    </div>
  )
}
