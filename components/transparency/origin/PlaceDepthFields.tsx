import {
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { type OriginDepthCode, type OriginLocalRow } from './originModel'

export function PlaceDepthFields({
  fields,
  rows,
  canEdit,
  showRegion,
  showGeo,
  granularity,
  patchField,
}: {
  fields: {
    country: ProofSubMetricRow | null
    granularity: ProofSubMetricRow | null
    region: ProofSubMetricRow | null
    producer: ProofSubMetricRow | null
    geolocation: ProofSubMetricRow | null
  }
  rows: Partial<Record<OriginDepthCode, OriginLocalRow | undefined>>
  canEdit: boolean
  showRegion: boolean
  showGeo: boolean
  granularity: string | null | undefined
  patchField: (field: ProofSubMetricRow, partial: Partial<DisclosureDraft>) => void
}) {
  return (
    <div className="tx-formula__block">
      <p className="tx-formula__block-title">Where?</p>
      <p className="tx-formula__block-hint">
        Start with a country. Add region, producer, and pin only when you can stand behind
        them.
      </p>

      {fields.country ? (
        <div className="tx-field">
          <div className="tx-label">Country</div>
          <input
            className="tx-control tx-control--narrow"
            disabled={!canEdit}
            maxLength={2}
            placeholder="US"
            value={rows.origin_country?.draft.valueText ?? ''}
            onChange={(e) => {
              const code = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
              patchField(fields.country!, {
                valueText: code || null,
              })
              if (code && fields.granularity && !rows.origin_granularity?.draft.valueText) {
                patchField(fields.granularity, { valueText: 'country' })
              }
            }}
          />
        </div>
      ) : null}

      {fields.granularity ? (
        <div className="tx-field">
          <div className="tx-label">How precise?</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={rows.origin_granularity?.draft.valueText ?? ''}
            onChange={(e) =>
              patchField(fields.granularity!, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(fields.granularity.allowed_values ?? []).map((code) => (
              <option key={code} value={code}>
                {formatProofCode(code)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {fields.region && showRegion ? (
        <div className="tx-field">
          <div className="tx-label">Region or locality</div>
          <input
            className="tx-control"
            disabled={!canEdit}
            placeholder="e.g. Atacama, Valle de Colchagua"
            value={rows.origin_region?.draft.valueText ?? ''}
            onChange={(e) =>
              patchField(fields.region!, {
                valueText: e.target.value || null,
              })
            }
          />
        </div>
      ) : fields.region && canEdit ? (
        <button
          type="button"
          className="tx-add"
          style={{ marginTop: 4 }}
          onClick={() => {
            if (fields.granularity) {
              patchField(fields.granularity, { valueText: 'region' })
            }
            patchField(fields.region!, { valueText: '' })
          }}
        >
          Add region or locality
        </button>
      ) : null}

      {fields.producer ? (
        <div className="tx-field">
          <div className="tx-label">Named producer</div>
          <input
            className="tx-control"
            disabled={!canEdit}
            placeholder="Farm, co-op, mill, or facility"
            value={rows.origin_producer_name?.draft.valueText ?? ''}
            onChange={(e) =>
              patchField(fields.producer!, {
                valueText: e.target.value || null,
              })
            }
          />
        </div>
      ) : null}

      {fields.geolocation && showGeo ? (
        <div className="tx-field">
          <div className="tx-label">Plot coordinates (optional)</div>
          <input
            className="tx-control"
            disabled={!canEdit}
            placeholder="lat, lng — publishing is opt-in"
            value={rows.origin_geolocation?.draft.valueText ?? ''}
            onChange={(e) =>
              patchField(fields.geolocation!, {
                valueText: e.target.value || null,
              })
            }
          />
          <p className="tx-formula__block-hint" style={{ marginTop: 8, marginBottom: 0 }}>
            You can name a region without publishing a pin.
          </p>
        </div>
      ) : fields.geolocation && canEdit && granularity && granularity !== 'plot' ? (
        <button
          type="button"
          className="tx-add"
          style={{ marginTop: 4 }}
          onClick={() => {
            if (fields.granularity) {
              patchField(fields.granularity, { valueText: 'plot' })
            }
          }}
        >
          Add plot coordinates
        </button>
      ) : null}
    </div>
  )
}
