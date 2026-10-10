import type { DisclosureDraft, SourceTier } from '@/lib/transparency/disclosures'

const SOURCE_TIERS: { value: SourceTier; label: string; hint: string }[] = [
  {
    value: 'brand_stated',
    label: 'Brand stated',
    hint: 'Your claim — fine for policy text; weak for certifications.',
  },
  {
    value: 'brand_document',
    label: 'Brand document',
    hint: 'Link to a code of conduct, policy PDF, or published list.',
  },
  {
    value: 'third_party_verified',
    label: 'Third-party verified',
    hint: 'Certificate or audit — issuer and URL required.',
  },
]

export default function ProvenanceFields({
  name,
  anchor,
  canEdit,
  onPatch,
}: {
  name: string
  anchor: DisclosureDraft | null | undefined
  canEdit: boolean
  onPatch: (patch: Partial<DisclosureDraft>) => void
}) {
  if (!anchor) return null
  const tier = anchor.sourceTier ?? 'brand_stated'

  return (
    <div key={tier} className={`tx-prov${tier === 'brand_stated' ? ' tx-prov--stated' : ''}`}>
      <p className="tx-prov__eyebrow">How you know</p>
      <div className="tx-tiers">
        {SOURCE_TIERS.map((t) => (
          <label
            key={t.value}
            className={`tx-tier${tier === t.value ? ' tx-tier--active' : ''}${
              !canEdit ? ' tx-tier--disabled' : ''
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={tier === t.value}
              disabled={!canEdit}
              onChange={() =>
                onPatch({
                  sourceTier: t.value,
                  sourceUrl: t.value === 'brand_stated' ? null : anchor.sourceUrl,
                  issuerName: t.value === 'third_party_verified' ? anchor.issuerName : null,
                  credentialId:
                    t.value === 'third_party_verified' ? anchor.credentialId : null,
                })
              }
            />
            <span>
              <span className="tx-tier__name">{t.label}</span>
              <span className="tx-tier__hint">{t.hint}</span>
            </span>
          </label>
        ))}
      </div>
      {tier !== 'brand_stated' ? (
        <div className="tx-field">
          <div className="tx-label">Source URL</div>
          <input
            type="url"
            className="tx-control"
            disabled={!canEdit}
            placeholder="https://"
            value={anchor.sourceUrl ?? ''}
            onChange={(e) => onPatch({ sourceUrl: e.target.value || null })}
          />
        </div>
      ) : null}
      {tier === 'third_party_verified' ? (
        <div className="tx-field">
          <div className="tx-grid tx-grid--2">
            <div>
              <div className="tx-label">Issuer</div>
              <input
                className="tx-control"
                disabled={!canEdit}
                value={anchor.issuerName ?? ''}
                onChange={(e) => onPatch({ issuerName: e.target.value || null })}
              />
            </div>
            <div>
              <div className="tx-label">Credential ID</div>
              <input
                className="tx-control"
                disabled={!canEdit}
                value={anchor.credentialId ?? ''}
                onChange={(e) => onPatch({ credentialId: e.target.value || null })}
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
          value={anchor.asofDate}
          onChange={(e) => onPatch({ asofDate: e.target.value })}
        />
      </div>
    </div>
  )
}
