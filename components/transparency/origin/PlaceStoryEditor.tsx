import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'
import { composePlaceLine, provenanceWhisperFromTier } from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import {
  norm,
  ORIGIN_DEPTH_CODES,
  type OriginDepthCode,
  type OriginLocalRow,
  SOURCE_TIERS,
} from './originModel'
import { PlaceDepthFields } from './PlaceDepthFields'

export function PlaceStoryEditor({
  subject,
  kind,
  fields,
  rows,
  canEdit,
  saving,
  error,
  onEnsureRow,
  onChange,
  onSaveStory,
}: {
  subject: string
  kind: 'product' | 'ingredient'
  fields: {
    country: ProofSubMetricRow | null
    granularity: ProofSubMetricRow | null
    region: ProofSubMetricRow | null
    producer: ProofSubMetricRow | null
    geolocation: ProofSubMetricRow | null
  }
  rows: Partial<Record<OriginDepthCode, OriginLocalRow | undefined>>
  canEdit: boolean
  saving: boolean
  error: string | null
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onSaveStory: () => void
}) {
  const anchor =
    rows.origin_country?.draft ??
    rows.origin_region?.draft ??
    rows.origin_producer_name?.draft ??
    null

  const granularity = rows.origin_granularity?.draft.valueText
  const showRegion =
    granularity === 'region' ||
    granularity === 'locality' ||
    granularity === 'plot' ||
    Boolean(rows.origin_region?.draft.valueText?.trim())
  const showGeo =
    granularity === 'plot' || Boolean(rows.origin_geolocation?.draft.valueText?.trim())

  const previewPlace = composePlaceLine({
    country: rows.origin_country?.draft.valueText,
    region: rows.origin_region?.draft.valueText,
    producer: rows.origin_producer_name?.draft.valueText,
  })
  const previewSubject =
    kind === 'product' ? 'This product' : subject.charAt(0).toUpperCase() + subject.slice(1)

  const patchField = (field: ProofSubMetricRow, partial: Partial<DisclosureDraft>) => {
    let key = rows[field.sub_metric_code as OriginDepthCode]?.key
    let base = rows[field.sub_metric_code as OriginDepthCode]?.draft
    if (!key || !base) {
      key = onEnsureRow(field, subject)
      base = blankDraft(field, {
        subjectKind: 'ingredient',
        subjectLabel: subject,
        status: 'disclosed',
        sourceTier: anchor?.sourceTier ?? 'brand_stated',
        sourceUrl: anchor?.sourceUrl ?? null,
        issuerName: anchor?.issuerName ?? null,
        credentialId: anchor?.credentialId ?? null,
        asofDate: anchor?.asofDate ?? new Date().toISOString().slice(0, 10),
        published: anchor?.published ?? false,
      })
    }
    onChange(field.sub_metric_code, key, {
      ...base,
      subjectKind: 'ingredient',
      subjectLabel: subject,
      status: 'disclosed',
      ...partial,
    })
  }

  const patchSharedMeta = (partial: Partial<DisclosureDraft>) => {
    const existingRows = ORIGIN_DEPTH_CODES.map((code) => rows[code]).filter(
      Boolean,
    ) as OriginLocalRow[]

    if (existingRows.length === 0) {
      if (fields.country) patchField(fields.country, partial)
      return
    }

    for (const row of existingRows) {
      onChange(row.draft.subMetricCode, row.key, {
        ...row.draft,
        ...partial,
      })
    }
  }

  const setTier = (tier: SourceTier) => {
    patchSharedMeta({
      sourceTier: tier,
      sourceUrl: tier === 'brand_stated' ? null : (anchor?.sourceUrl ?? null),
      issuerName: tier === 'third_party_verified' ? (anchor?.issuerName ?? null) : null,
      credentialId: tier === 'third_party_verified' ? (anchor?.credentialId ?? null) : null,
    })
  }

  const provClass =
    (anchor?.sourceTier ?? 'brand_stated') === 'third_party_verified'
      ? 'tx-prov tx-prov--verified'
      : (anchor?.sourceTier ?? 'brand_stated') === 'brand_document'
        ? 'tx-prov tx-prov--document'
        : 'tx-prov tx-prov--stated'

  const canSave = Boolean(
    rows.origin_country?.draft.valueText?.trim() ||
      rows.origin_region?.draft.valueText?.trim() ||
      rows.origin_producer_name?.draft.valueText?.trim() ||
      rows.origin_geolocation?.draft.valueText?.trim(),
  )

  return (
    <div className="tx-origin__story">
      {previewPlace ? (
        <ShopperPreview
          line={`${previewSubject} — ${previewPlace}`}
          whisper={provenanceWhisperFromTier({
            status: 'disclosed',
            sourceTier: anchor?.sourceTier,
            issuerName: anchor?.issuerName,
          })}
        />
      ) : null}

      <PlaceDepthFields
        fields={fields}
        rows={rows}
        canEdit={canEdit}
        showRegion={showRegion}
        showGeo={showGeo}
        granularity={granularity}
        patchField={patchField}
      />

      <div key={anchor?.sourceTier ?? 'brand_stated'} className={provClass}>
        <p className="tx-prov__eyebrow">How you know</p>
        <div className="tx-label">Provenance for this place story</div>
        <div className="tx-tiers">
          {SOURCE_TIERS.map((tier) => (
            <label
              key={tier.value}
              className={`tx-tier${
                (anchor?.sourceTier ?? 'brand_stated') === tier.value ? ' tx-tier--active' : ''
              }${!canEdit ? ' tx-tier--disabled' : ''}`}
            >
              <input
                type="radio"
                name={`origin-tier-${norm(subject)}`}
                checked={(anchor?.sourceTier ?? 'brand_stated') === tier.value}
                disabled={!canEdit}
                onChange={() => setTier(tier.value)}
              />
              <span>
                <span className="tx-tier__name">{tier.label}</span>
                <span className="tx-tier__hint">{tier.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {(anchor?.sourceTier ?? 'brand_stated') !== 'brand_stated' ? (
          <div className="tx-field">
            <div className="tx-label">Source URL</div>
            <input
              type="url"
              className="tx-control"
              disabled={!canEdit}
              placeholder="https://"
              value={anchor?.sourceUrl ?? ''}
              onChange={(e) => patchSharedMeta({ sourceUrl: e.target.value || null })}
            />
          </div>
        ) : null}

        {(anchor?.sourceTier ?? 'brand_stated') === 'third_party_verified' ? (
          <div className="tx-field">
            <div className="tx-grid tx-grid--2">
              <div>
                <div className="tx-label">Issuer</div>
                <input
                  className="tx-control"
                  disabled={!canEdit}
                  value={anchor?.issuerName ?? ''}
                  onChange={(e) => patchSharedMeta({ issuerName: e.target.value || null })}
                />
              </div>
              <div>
                <div className="tx-label">Credential ID (optional)</div>
                <input
                  className="tx-control"
                  disabled={!canEdit}
                  value={anchor?.credentialId ?? ''}
                  onChange={(e) => patchSharedMeta({ credentialId: e.target.value || null })}
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
            value={
              anchor?.asofDate ?? new Date().toISOString().slice(0, 10)
            }
            onChange={(e) => patchSharedMeta({ asofDate: e.target.value })}
          />
        </div>
      </div>

      <div className="tx-footer" style={{ marginTop: 0 }}>
        <label className="tx-publish">
          <input
            type="checkbox"
            checked={anchor?.published ?? false}
            disabled={!canEdit || !canSave}
            onChange={(e) => patchSharedMeta({ published: e.target.checked })}
          />
          <span>
            <span className="tx-publish__label">Show this place story to shoppers</span>
            <span className="tx-publish__hint">
              Applies to every depth you save for {subject}.
            </span>
          </span>
        </label>
        {canEdit ? (
          <button
            type="button"
            className="tx-btn tx-btn--primary"
            disabled={saving || !canSave}
            onClick={onSaveStory}
          >
            {saving ? 'Saving…' : 'Save place story'}
          </button>
        ) : null}
      </div>
      {error ? <p className="tx-error">{error}</p> : null}
    </div>
  )
}
