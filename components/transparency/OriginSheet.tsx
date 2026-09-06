'use client'

import { useMemo, useState } from 'react'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence, type RowPresence } from '@/lib/transparency/proofChapters'
import { composePlaceLine, provenanceWhisperFromTier } from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import {
  displayAllCapsPhrase,
  splitIngredientStatement,
} from '@/app/(portal)/products/[productId]/tabs/compositionPresentation'

export const FINISHED_PRODUCT_SUBJECT = 'Finished product'

export const ORIGIN_DEPTH_CODES = [
  'origin_country',
  'origin_granularity',
  'origin_region',
  'origin_producer_name',
  'origin_geolocation',
] as const

export type OriginDepthCode = (typeof ORIGIN_DEPTH_CODES)[number]

export type OriginLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

type Props = {
  ingredientStatement: string | null
  fieldsByCode: Record<string, ProofSubMetricRow | undefined>
  rowsByCode: Record<string, OriginLocalRow[]>
  canEdit: boolean
  savingSubject: string | null
  storyError: string | null
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onAddCustomIngredient: (name: string) => void
  onSaveStory: (subject: string) => void
  onSaveCoverage: (row: OriginLocalRow) => void
  onClearStoryError?: () => void
}

const SOURCE_TIERS: { value: SourceTier; label: string; hint: string }[] = [
  {
    value: 'brand_stated',
    label: 'Brand stated',
    hint: 'Your claim — no document link required.',
  },
  {
    value: 'brand_document',
    label: 'Brand document',
    hint: 'Link to a page, PDF, or report you publish.',
  },
  {
    value: 'third_party_verified',
    label: 'Third-party verified',
    hint: 'Certificate or audit — issuer and URL required.',
  },
]

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function findRow(rows: OriginLocalRow[], subject: string): OriginLocalRow | undefined {
  const n = norm(subject)
  return rows.find((r) => norm(r.draft.subjectLabel ?? '') === n)
}

function pillClass(p: RowPresence): string {
  switch (p) {
    case 'published':
      return 'tx-pill tx-pill--public'
    case 'private':
      return 'tx-pill tx-pill--private'
    case 'declined':
      return 'tx-pill tx-pill--declined'
    default:
      return 'tx-pill tx-pill--idle'
  }
}

function presenceCopy(p: RowPresence): string {
  switch (p) {
    case 'published':
      return 'Published'
    case 'private':
      return 'Private'
    case 'declined':
      return 'Not reporting'
    default:
      return '—'
  }
}

function storyPresence(
  rows: Partial<Record<OriginDepthCode, OriginLocalRow | undefined>>,
): RowPresence {
  const order: OriginDepthCode[] = [
    'origin_country',
    'origin_region',
    'origin_producer_name',
    'origin_geolocation',
    'origin_granularity',
  ]
  let best: RowPresence = 'not_started'
  for (const code of order) {
    const p = rows[code] ? rowPresence(rows[code]!.draft) : 'not_started'
    if (p === 'published') return 'published'
    if (p === 'private' && best === 'not_started') best = 'private'
    if (p === 'declined' && best === 'not_started') best = 'declined'
  }
  return best
}

type IngredientLine = {
  name: string
  display: string
  fromLabel: boolean
  kind: 'product' | 'ingredient'
}

export default function OriginSheet({
  ingredientStatement,
  fieldsByCode,
  rowsByCode,
  canEdit,
  savingSubject,
  storyError,
  onChange,
  onEnsureRow,
  onAddCustomIngredient,
  onSaveStory,
  onSaveCoverage,
  onClearStoryError,
}: Props) {
  const [openName, setOpenName] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')

  const countryField = fieldsByCode['origin_country'] ?? null
  const granField = fieldsByCode['origin_granularity'] ?? null
  const regionField = fieldsByCode['origin_region'] ?? null
  const producerField = fieldsByCode['origin_producer_name'] ?? null
  const geoField = fieldsByCode['origin_geolocation'] ?? null
  const coverageField = fieldsByCode['origin_coverage_pct'] ?? null

  const labelNames = useMemo(() => {
    if (!ingredientStatement?.trim()) return [] as string[]
    return splitIngredientStatement(ingredientStatement).map((p) => displayAllCapsPhrase(p))
  }, [ingredientStatement])

  const lines = useMemo(() => {
    const seen = new Set<string>()
    const out: IngredientLine[] = [
      {
        name: FINISHED_PRODUCT_SUBJECT,
        display: FINISHED_PRODUCT_SUBJECT,
        fromLabel: false,
        kind: 'product',
      },
    ]
    seen.add(norm(FINISHED_PRODUCT_SUBJECT))

    for (const name of labelNames) {
      const n = norm(name)
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push({ name, display: name, fromLabel: true, kind: 'ingredient' })
    }

    for (const code of ORIGIN_DEPTH_CODES) {
      for (const row of rowsByCode[code] ?? []) {
        const label = row.draft.subjectLabel?.trim()
        if (!label) continue
        const n = norm(label)
        if (!n || seen.has(n)) continue
        seen.add(n)
        out.push({ name: label, display: label, fromLabel: false, kind: 'ingredient' })
      }
    }

    return out
  }, [labelNames, rowsByCode])

  const coverageRow = coverageField
    ? (rowsByCode['origin_coverage_pct'] ?? [])[0]
    : undefined

  const submitCustom = () => {
    const name = customName.trim()
    if (!name) return
    onAddCustomIngredient(name)
    setCustomName('')
    setShowAdd(false)
    setOpenName(name)
  }

  if (!countryField && !regionField && !producerField) {
    return <div className="tx-empty">No origin fields in the registry.</div>
  }

  return (
    <div className="tx-origin">
      <div className="tx-formula__banner">
        {ingredientStatement?.trim() ? (
          <p className="tx-formula__banner-text">
            Seeded from this SKU’s ingredient statement. Write a place story per ingredient —
            country first, then deepen only as far as you can prove.
          </p>
        ) : (
          <p className="tx-formula__banner-text">
            No ingredient statement on this SKU yet. Start with{' '}
            <strong>Finished product</strong>, or name an ingredient below.
          </p>
        )}
      </div>

      {coverageField && coverageRow ? (
        <CoverageStrip
          field={coverageField}
          row={coverageRow}
          canEdit={canEdit}
          saving={savingSubject === coverageRow.key}
          onChange={(draft) => onChange(coverageField.sub_metric_code, coverageRow.key, draft)}
          onSave={() => onSaveCoverage(coverageRow)}
        />
      ) : null}

      <div className="tx-formula__sheet">
        <div className="tx-origin__head" aria-hidden>
          <span>Subject</span>
          <span>Place</span>
          <span>Status</span>
        </div>

        {lines.map((line) => {
          const rows: Partial<Record<OriginDepthCode, OriginLocalRow | undefined>> = {
            origin_country: countryField
              ? findRow(rowsByCode['origin_country'] ?? [], line.name)
              : undefined,
            origin_granularity: granField
              ? findRow(rowsByCode['origin_granularity'] ?? [], line.name)
              : undefined,
            origin_region: regionField
              ? findRow(rowsByCode['origin_region'] ?? [], line.name)
              : undefined,
            origin_producer_name: producerField
              ? findRow(rowsByCode['origin_producer_name'] ?? [], line.name)
              : undefined,
            origin_geolocation: geoField
              ? findRow(rowsByCode['origin_geolocation'] ?? [], line.name)
              : undefined,
          }
          const open = openName === line.name
          const place = composePlaceLine({
            country: rows.origin_country?.draft.valueText,
            region: rows.origin_region?.draft.valueText,
            producer: rows.origin_producer_name?.draft.valueText,
          })
          const presence = storyPresence(rows)

          return (
            <div
              key={norm(line.name)}
              className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
            >
              <button
                type="button"
                className="tx-origin__hit"
                onClick={() => {
                  onClearStoryError?.()
                  setOpenName(open ? null : line.name)
                }}
                aria-expanded={open}
              >
                <span className="tx-formula__name">
                  <span className="tx-formula__name-text">{line.display}</span>
                  {line.kind === 'product' ? (
                    <span className="tx-formula__tag">Product</span>
                  ) : !line.fromLabel ? (
                    <span className="tx-formula__tag">Not on label</span>
                  ) : null}
                  {rows.origin_geolocation?.draft.valueText?.trim() ? (
                    <span className="tx-formula__tag tx-formula__tag--soft">Pin</span>
                  ) : null}
                </span>
                <span className="tx-origin__place">{place || '—'}</span>
                <span className="tx-formula__status">
                  <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
                  <span className="tx-row__chev" aria-hidden>
                    ›
                  </span>
                </span>
              </button>

              {open ? (
                <div className="tx-formula__editor">
                  <PlaceStoryEditor
                    subject={line.name}
                    kind={line.kind}
                    fields={{
                      country: countryField,
                      granularity: granField,
                      region: regionField,
                      producer: producerField,
                      geolocation: geoField,
                    }}
                    rows={rows}
                    canEdit={canEdit}
                    saving={savingSubject === norm(line.name)}
                    error={
                      storyError && openName === line.name ? storyError : null
                    }
                    onEnsureRow={onEnsureRow}
                    onChange={onChange}
                    onSaveStory={() => onSaveStory(line.name)}
                  />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {canEdit ? (
        <div className="tx-formula__add">
          {showAdd ? (
            <div className="tx-formula__add-form">
              <input
                className="tx-control"
                value={customName}
                placeholder="e.g. Cocoa"
                autoFocus
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitCustom()
                  }
                }}
              />
              <button type="button" className="tx-btn tx-btn--primary" onClick={submitCustom}>
                Add
              </button>
              <button
                type="button"
                className="tx-btn"
                onClick={() => {
                  setShowAdd(false)
                  setCustomName('')
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="tx-add" onClick={() => setShowAdd(true)}>
              Ingredient not on the label
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function CoverageStrip({
  field,
  row,
  canEdit,
  saving,
  onChange,
  onSave,
}: {
  field: ProofSubMetricRow
  row: OriginLocalRow
  canEdit: boolean
  saving: boolean
  onChange: (draft: DisclosureDraft) => void
  onSave: () => void
}) {
  return (
    <div className="tx-origin__coverage">
      <div>
        <p className="tx-origin__coverage-title">Formula coverage</p>
        <p className="tx-origin__coverage-hint">
          Share of the formula by weight for which you’ve stated origin. Whole-product only.
        </p>
      </div>
      <div className="tx-inline" style={{ maxWidth: 200 }}>
        <input
          type="number"
          step="any"
          min={0}
          max={100}
          className="tx-control"
          disabled={!canEdit}
          value={row.draft.valueNum ?? ''}
          onChange={(e) =>
            onChange({
              ...row.draft,
              status: 'disclosed',
              valueNum: e.target.value === '' ? null : Number(e.target.value),
              valueUnit: null,
            })
          }
        />
        <span className="tx-unit">%</span>
      </div>
      {canEdit ? (
        <button
          type="button"
          className="tx-btn tx-btn--primary"
          disabled={saving || row.draft.valueNum == null}
          onClick={onSave}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      ) : null}
    </div>
  )
}

function PlaceStoryEditor({
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
