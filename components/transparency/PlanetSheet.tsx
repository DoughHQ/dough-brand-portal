'use client'

import { useMemo, useState } from 'react'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'
import { formatProofCode, formatUnitSuffix } from '@/lib/transparency/displayMap'
import { rowPresence, type RowPresence } from '@/lib/transparency/proofChapters'
import {
  composePackLine,
  composePcfLine,
  provenanceWhisperFromTier,
} from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'

export const PLANET_PCF_CODES = [
  'product_carbon_footprint',
  'pcf_assurance_level',
] as const

export const PLANET_PACK_CODES = [
  'packaging_primary_material',
  'packaging_disposal_route',
  'packaging_recycled_content_pct',
  'packaging_reuse_model',
] as const

export const DEFAULT_PACK_COMPONENTS = ['Bottle', 'Cap', 'Sleeve'] as const

export type PlanetLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

type Props = {
  fieldsByCode: Record<string, ProofSubMetricRow | undefined>
  rowsByCode: Record<string, PlanetLocalRow[]>
  canEdit: boolean
  savingKey: string | null
  storyError: string | null
  errors: Record<string, string>
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onSaveRow: (field: ProofSubMetricRow, row: PlanetLocalRow) => void
  onSaveBundle: (codes: readonly string[], bundleKey: string) => void
  onClearStoryError?: () => void
  onSeedPackComponents: (names: string[]) => void
}

const SOURCE_TIERS: { value: SourceTier; label: string; hint: string }[] = [
  {
    value: 'brand_stated',
    label: 'Brand stated',
    hint: 'Fragile for published carbon claims — prefer a document or verification.',
  },
  {
    value: 'brand_document',
    label: 'Brand document',
    hint: 'Link to LCA, EPD, or published footprint report.',
  },
  {
    value: 'third_party_verified',
    label: 'Third-party verified',
    hint: 'Certificate or assurance — issuer and URL required.',
  },
]

function wholeRow(rows: PlanetLocalRow[] | undefined): PlanetLocalRow | undefined {
  return rows?.[0]
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function findSubject(rows: PlanetLocalRow[], subject: string): PlanetLocalRow | undefined {
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

export default function PlanetSheet({
  fieldsByCode,
  rowsByCode,
  canEdit,
  savingKey,
  storyError,
  errors,
  onChange,
  onEnsureRow,
  onSaveRow,
  onSaveBundle,
  onClearStoryError,
  onSeedPackComponents,
}: Props) {
  const pcfField = fieldsByCode['product_carbon_footprint']
  const assuranceField = fieldsByCode['pcf_assurance_level']
  const materialField = fieldsByCode['packaging_primary_material']
  const disposalField = fieldsByCode['packaging_disposal_route']
  const recycledField = fieldsByCode['packaging_recycled_content_pct']
  const reuseField = fieldsByCode['packaging_reuse_model']

  const pcfRow = wholeRow(rowsByCode['product_carbon_footprint'])
  const assuranceRow = wholeRow(rowsByCode['pcf_assurance_level'])

  const packSubjects = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const code of PLANET_PACK_CODES) {
      for (const row of rowsByCode[code] ?? []) {
        const label = row.draft.subjectLabel?.trim()
        if (!label) continue
        const n = norm(label)
        if (seen.has(n)) continue
        seen.add(n)
        out.push(label)
      }
    }
    return out
  }, [rowsByCode])

  const hasAnyPackRow = PLANET_PACK_CODES.some(
    (c) => (rowsByCode[c] ?? []).some((r) => r.draft.subjectLabel?.trim()),
  )

  return (
    <div className="tx-ops">
      {storyError ? <p className="tx-error">{storyError}</p> : null}

      <section className="tx-ops__room">
        <header className="tx-ops__room-head">
          <p className="tx-ops__room-kicker">Footprint</p>
          <h4 className="tx-ops__room-title">Product carbon claim</h4>
          <p className="tx-ops__room-lede">
            Number, boundary, method, and data quality as one claim — never green theatre.
          </p>
        </header>
        {pcfField && pcfRow ? (
          <FootprintEditor
            pcfField={pcfField}
            assuranceField={assuranceField ?? null}
            pcfRow={pcfRow}
            assuranceRow={assuranceRow}
            canEdit={canEdit}
            saving={savingKey === 'planet-pcf'}
            onChange={onChange}
            onSave={() => onSaveBundle(PLANET_PCF_CODES, 'planet-pcf')}
            onClearError={onClearStoryError}
          />
        ) : (
          <p className="tx-ops__empty">No product footprint fields in the registry.</p>
        )}
      </section>

      <section className="tx-ops__room">
        <header className="tx-ops__room-head">
          <p className="tx-ops__room-kicker">Pack</p>
          <h4 className="tx-ops__room-title">Packaging components</h4>
          <p className="tx-ops__room-lede">
            Material, disposal, recycled content — per bottle, cap, sleeve, or tray.
          </p>
        </header>
        {!materialField && !disposalField ? (
          <p className="tx-ops__empty">No packaging fields in the registry.</p>
        ) : (
          <PackSheet
            fields={{
              material: materialField ?? null,
              disposal: disposalField ?? null,
              recycled: recycledField ?? null,
              reuse: reuseField ?? null,
            }}
            subjects={packSubjects}
            rowsByCode={rowsByCode}
            canEdit={canEdit}
            savingKey={savingKey}
            errors={errors}
            showSeed={!hasAnyPackRow}
            onChange={onChange}
            onEnsureRow={onEnsureRow}
            onSaveRow={onSaveRow}
            onSeed={() => onSeedPackComponents([...DEFAULT_PACK_COMPONENTS])}
          />
        )}
      </section>
    </div>
  )
}

function FootprintEditor({
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
        <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
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

function PackSheet({
  fields,
  subjects,
  rowsByCode,
  canEdit,
  savingKey,
  errors,
  showSeed,
  onChange,
  onEnsureRow,
  onSaveRow,
  onSeed,
}: {
  fields: {
    material: ProofSubMetricRow | null
    disposal: ProofSubMetricRow | null
    recycled: ProofSubMetricRow | null
    reuse: ProofSubMetricRow | null
  }
  subjects: string[]
  rowsByCode: Record<string, PlanetLocalRow[]>
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  showSeed: boolean
  onChange: Props['onChange']
  onEnsureRow: Props['onEnsureRow']
  onSaveRow: Props['onSaveRow']
  onSeed: () => void
}) {
  const [openName, setOpenName] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')

  return (
    <div className="tx-ops__sub">
      {showSeed && canEdit ? (
        <button type="button" className="tx-add" onClick={onSeed} style={{ marginBottom: 10 }}>
          Seed Bottle, Cap, Sleeve
        </button>
      ) : null}

      <div className="tx-formula__sheet">
        <div className="tx-ops__sheet-head" aria-hidden>
          <span>Component</span>
          <span>Story</span>
          <span>Status</span>
        </div>
        {subjects.length === 0 ? (
          <div className="tx-formula__empty">
            No packaging components yet. Seed defaults or add one.
          </div>
        ) : (
          subjects.map((name) => {
            const material = fields.material
              ? findSubject(rowsByCode['packaging_primary_material'] ?? [], name)
              : undefined
            const disposal = fields.disposal
              ? findSubject(rowsByCode['packaging_disposal_route'] ?? [], name)
              : undefined
            const recycled = fields.recycled
              ? findSubject(rowsByCode['packaging_recycled_content_pct'] ?? [], name)
              : undefined
            const reuse = fields.reuse
              ? findSubject(rowsByCode['packaging_reuse_model'] ?? [], name)
              : undefined
            const open = openName === name
            const line = composePackLine({
              component: name,
              material: material?.draft.valueText,
              disposal: disposal?.draft.valueText,
              recycledPct: recycled?.draft.valueNum,
              reuse: reuse?.draft.valueText,
            })
            const presence = rowPresence(
              material?.draft ?? disposal?.draft ?? recycled?.draft ?? null,
            )
            return (
              <div
                key={norm(name)}
                className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
              >
                <button
                  type="button"
                  className="tx-ops__sheet-hit"
                  onClick={() => setOpenName(open ? null : name)}
                  aria-expanded={open}
                >
                  <span className="tx-formula__name-text">{name}</span>
                  <span className="tx-origin__place">{line.includes('·') ? line : '—'}</span>
                  <span className="tx-formula__status">
                    <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
                    <span className="tx-row__chev" aria-hidden>
                      ›
                    </span>
                  </span>
                </button>
                {open ? (
                  <div className="tx-formula__editor">
                    <PackEditor
                      subject={name}
                      fields={fields}
                      rows={{ material, disposal, recycled, reuse }}
                      canEdit={canEdit}
                      savingKey={savingKey}
                      errors={errors}
                      onChange={onChange}
                      onEnsureRow={onEnsureRow}
                      onSaveRow={onSaveRow}
                    />
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>

      {canEdit ? (
        <div className="tx-formula__add">
          {showAdd ? (
            <div className="tx-formula__add-form">
              <input
                className="tx-control"
                value={customName}
                placeholder="e.g. Tray"
                autoFocus
                onChange={(e) => setCustomName(e.target.value)}
              />
              <button
                type="button"
                className="tx-btn tx-btn--primary"
                onClick={() => {
                  const name = customName.trim()
                  if (!name || !fields.material) return
                  onEnsureRow(fields.material, name)
                  setCustomName('')
                  setShowAdd(false)
                  setOpenName(name)
                }}
              >
                Add
              </button>
              <button type="button" className="tx-btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="tx-add" onClick={() => setShowAdd(true)}>
              Add packaging component
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function PackEditor({
  subject,
  fields,
  rows,
  canEdit,
  savingKey,
  errors,
  onChange,
  onEnsureRow,
  onSaveRow,
}: {
  subject: string
  fields: {
    material: ProofSubMetricRow | null
    disposal: ProofSubMetricRow | null
    recycled: ProofSubMetricRow | null
    reuse: ProofSubMetricRow | null
  }
  rows: {
    material?: PlanetLocalRow
    disposal?: PlanetLocalRow
    recycled?: PlanetLocalRow
    reuse?: PlanetLocalRow
  }
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  onChange: Props['onChange']
  onEnsureRow: Props['onEnsureRow']
  onSaveRow: Props['onSaveRow']
}) {
  const patch = (
    field: ProofSubMetricRow,
    row: PlanetLocalRow | undefined,
    partial: Partial<DisclosureDraft>,
  ) => {
    let key = row?.key
    let base = row?.draft
    if (!key || !base) {
      key = onEnsureRow(field, subject)
      base = blankDraft(field, {
        subjectKind: 'component',
        subjectLabel: subject,
        status: 'disclosed',
      })
    }
    onChange(field.sub_metric_code, key, {
      ...base,
      subjectKind: 'component',
      subjectLabel: subject,
      status: 'disclosed',
      ...partial,
    })
  }

  const preview = composePackLine({
    component: subject,
    material: rows.material?.draft.valueText,
    disposal: rows.disposal?.draft.valueText,
    recycledPct: rows.recycled?.draft.valueNum,
    reuse: rows.reuse?.draft.valueText,
  })

  const saveAll = () => {
    const pairs: [ProofSubMetricRow | null, PlanetLocalRow | undefined][] = [
      [fields.material, rows.material],
      [fields.disposal, rows.disposal],
      [fields.recycled, rows.recycled],
      [fields.reuse, rows.reuse],
    ]
    for (const [field, row] of pairs) {
      if (!field || !row) continue
      const has =
        row.draft.valueText?.trim() ||
        row.draft.valueNum != null
      if (has) onSaveRow(field, row)
    }
  }

  return (
    <div className="tx-formula__block">
      <ShopperPreview line={preview.includes('·') ? preview : ''} />
      {fields.material ? (
        <div className="tx-field">
          <div className="tx-label">Material</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={rows.material?.draft.valueText ?? ''}
            onChange={(e) =>
              patch(fields.material!, rows.material, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(fields.material.allowed_values ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {fields.disposal ? (
        <div className="tx-field">
          <div className="tx-label">Disposal</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={rows.disposal?.draft.valueText ?? ''}
            onChange={(e) =>
              patch(fields.disposal!, rows.disposal, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(fields.disposal.allowed_values ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {fields.recycled ? (
        <div className="tx-field">
          <div className="tx-label">Recycled content</div>
          <div className="tx-inline" style={{ maxWidth: 200 }}>
            <input
              type="number"
              step="any"
              min={0}
              max={100}
              className="tx-control"
              disabled={!canEdit}
              value={rows.recycled?.draft.valueNum ?? ''}
              onChange={(e) =>
                patch(fields.recycled!, rows.recycled, {
                  valueNum: e.target.value === '' ? null : Number(e.target.value),
                  valueUnit: 'percent',
                })
              }
            />
            <span className="tx-unit">%</span>
          </div>
        </div>
      ) : null}
      {fields.reuse ? (
        <div className="tx-field">
          <div className="tx-label">Reuse / refill</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={rows.reuse?.draft.valueText ?? ''}
            onChange={(e) =>
              patch(fields.reuse!, rows.reuse, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(fields.reuse.allowed_values ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {canEdit ? (
        <button
          type="button"
          className="tx-btn tx-btn--primary"
          disabled={
            savingKey != null &&
            [rows.material, rows.disposal, rows.recycled, rows.reuse].some(
              (r) => r && savingKey === r.key,
            )
          }
          onClick={saveAll}
        >
          Save component
        </button>
      ) : null}
      {[rows.material, rows.disposal, rows.recycled, rows.reuse].map((r) =>
        r && errors[r.key] ? (
          <p key={r.key} className="tx-error">
            {errors[r.key]}
          </p>
        ) : null,
      )}
    </div>
  )
}
