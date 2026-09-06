'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence, type RowPresence } from '@/lib/transparency/proofChapters'
import {
  composeKeptLine,
  composeMadeLine,
  provenanceWhisperFromTier,
} from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import {
  displayAllCapsPhrase,
  splitIngredientStatement,
} from '@/app/(portal)/products/[productId]/tabs/compositionPresentation'

export type OpsLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

export const OPS_MADE_CODES = ['process_method', 'process_parameter'] as const
export const OPS_KEPT_CODES = [
  'storage_condition',
  'shelf_life_basis',
  'handling_note',
] as const

type Props = {
  ingredientStatement: string | null
  fieldsByCode: Record<string, ProofSubMetricRow | undefined>
  rowsByCode: Record<string, OpsLocalRow[]>
  canEdit: boolean
  savingKey: string | null
  storyError: string | null
  errors: Record<string, string>
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onSaveRow: (field: ProofSubMetricRow, row: OpsLocalRow) => void
  onSaveBundle: (codes: readonly string[], bundleKey: string) => void
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

function findSubjectRow(rows: OpsLocalRow[], subject: string): OpsLocalRow | undefined {
  const n = norm(subject)
  return rows.find((r) => norm(r.draft.subjectLabel ?? '') === n)
}

function wholeRow(rows: OpsLocalRow[] | undefined): OpsLocalRow | undefined {
  return rows?.[0]
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

export function isOilOrFatLike(name: string): boolean {
  return /\b(oil|butter|fat|ghee|lard|tallow|shortening|margarine)\b/i.test(name)
}

export function isNaturalFlavorPhrase(name: string): boolean {
  return /\bnatural\s+flavou?rs?\b/i.test(name.trim())
}

type LabelLine = { name: string; display: string; fromLabel: boolean }

export default function OperationsSheet({
  ingredientStatement,
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
}: Props) {
  const labelParts = useMemo(() => {
    if (!ingredientStatement?.trim()) return [] as string[]
    return splitIngredientStatement(ingredientStatement).map((p) => displayAllCapsPhrase(p))
  }, [ingredientStatement])

  const oilLines = useMemo(() => {
    const seen = new Set<string>()
    const out: LabelLine[] = []
    for (const name of labelParts) {
      if (!isOilOrFatLike(name)) continue
      const n = norm(name)
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push({ name, display: name, fromLabel: true })
    }
    for (const row of rowsByCode['refinement_state'] ?? []) {
      const label = row.draft.subjectLabel?.trim()
      if (!label) continue
      const n = norm(label)
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push({ name: label, display: label, fromLabel: false })
    }
    return out
  }, [labelParts, rowsByCode])

  const flavorLines = useMemo(() => {
    const seen = new Set<string>()
    const out: LabelLine[] = []
    for (const name of labelParts) {
      if (!isNaturalFlavorPhrase(name)) continue
      const n = norm(name)
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push({ name, display: name, fromLabel: true })
    }
    for (const row of rowsByCode['natural_flavor_composition'] ?? []) {
      const label = row.draft.subjectLabel?.trim()
      if (!label) continue
      const n = norm(label)
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push({ name: label, display: label, fromLabel: false })
    }
    return out
  }, [labelParts, rowsByCode])

  const aidRows = rowsByCode['processing_aid_disclosed'] ?? []

  const methodField = fieldsByCode['process_method']
  const paramField = fieldsByCode['process_parameter']
  const pasteurField = fieldsByCode['pasteurization_method']
  const additionalField = fieldsByCode['additional_treatment']
  const refineField = fieldsByCode['refinement_state']
  const aidField = fieldsByCode['processing_aid_disclosed']
  const flavorField = fieldsByCode['natural_flavor_composition']
  const storageField = fieldsByCode['storage_condition']
  const shelfField = fieldsByCode['shelf_life_basis']
  const handlingField = fieldsByCode['handling_note']

  return (
    <div className="tx-ops">
      <div className="tx-formula__banner">
        <p className="tx-formula__banner-text">
          How it’s made, what was done to it, what’s behind the label, and how to keep it —
          process as fact, not romance.
        </p>
      </div>

      {storyError ? <p className="tx-error">{storyError}</p> : null}

      <Room
        kicker="Made"
        title="How this is made"
        lede="Product-level process. Oil pressing and refining live under Treated — not here."
      >
        {methodField || paramField ? (
          <MadeKeptEditor
            kind="made"
            canEdit={canEdit}
            saving={savingKey === 'ops-made'}
            error={null}
            methodField={methodField}
            paramField={paramField}
            methodRow={wholeRow(rowsByCode['process_method'])}
            paramRow={wholeRow(rowsByCode['process_parameter'])}
            onChange={onChange}
            onSave={() => onSaveBundle(OPS_MADE_CODES, 'ops-made')}
            onClearError={onClearStoryError}
          />
        ) : (
          <p className="tx-ops__empty">No process fields in the registry.</p>
        )}
      </Room>

      <Room
        kicker="Treated"
        title="What was done to it"
        lede="Heat, pressure, and standard-of-identity treatments — plus refinement for named oils and fats."
      >
        <div className="tx-ops__stack">
          {pasteurField ? (
            <WholeEnumCard
              title="Pasteurization"
              hint="Including an explicit raw / unpasteurized answer."
              field={pasteurField}
              row={wholeRow(rowsByCode['pasteurization_method'])}
              canEdit={canEdit}
              saving={
                wholeRow(rowsByCode['pasteurization_method']) != null &&
                savingKey === wholeRow(rowsByCode['pasteurization_method'])!.key
              }
              error={
                wholeRow(rowsByCode['pasteurization_method'])
                  ? errors[wholeRow(rowsByCode['pasteurization_method'])!.key] ?? null
                  : null
              }
              onChange={onChange}
              onSave={onSaveRow}
            />
          ) : null}

          {additionalField ? (
            <WholeEnumCard
              title="Additional treatment"
              hint="Bleached, alkalized, hydrogenated, and other standard-of-identity terms."
              field={additionalField}
              row={wholeRow(rowsByCode['additional_treatment'])}
              canEdit={canEdit}
              saving={
                wholeRow(rowsByCode['additional_treatment']) != null &&
                savingKey === wholeRow(rowsByCode['additional_treatment'])!.key
              }
              error={
                wholeRow(rowsByCode['additional_treatment'])
                  ? errors[wholeRow(rowsByCode['additional_treatment'])!.key] ?? null
                  : null
              }
              onChange={onChange}
              onSave={onSaveRow}
            />
          ) : null}

          {refineField ? (
            <RefinementSheet
              field={refineField}
              lines={oilLines}
              rows={rowsByCode['refinement_state'] ?? []}
              canEdit={canEdit}
              savingKey={savingKey}
              errors={errors}
              onChange={onChange}
              onEnsureRow={onEnsureRow}
              onSave={onSaveRow}
            />
          ) : null}
        </div>
      </Room>

      <Room
        kicker="Behind the label"
        title="What’s not on the list"
        lede="Processing aids and what “natural flavors” actually are — seeded when the label names them."
      >
        <div className="tx-ops__stack">
          {flavorField ? (
            <FlavorSheet
              field={flavorField}
              lines={flavorLines}
              rows={rowsByCode['natural_flavor_composition'] ?? []}
              canEdit={canEdit}
              savingKey={savingKey}
              errors={errors}
              onChange={onChange}
              onEnsureRow={onEnsureRow}
              onSave={onSaveRow}
            />
          ) : null}

          {aidField ? (
            <AidSheet
              field={aidField}
              rows={aidRows}
              canEdit={canEdit}
              savingKey={savingKey}
              errors={errors}
              onChange={onChange}
              onEnsureRow={onEnsureRow}
              onSave={onSaveRow}
            />
          ) : null}

          {!flavorField && !aidField ? (
            <p className="tx-ops__empty">No additive fields in the registry.</p>
          ) : null}
        </div>
      </Room>

      <Room
        kicker="Kept"
        title="How to keep it"
        lede="Storage, what the on-pack date means, and guidance after opening."
      >
        {storageField || shelfField || handlingField ? (
          <MadeKeptEditor
            kind="kept"
            canEdit={canEdit}
            saving={savingKey === 'ops-kept'}
            error={null}
            storageField={storageField}
            shelfField={shelfField}
            handlingField={handlingField}
            storageRow={wholeRow(rowsByCode['storage_condition'])}
            shelfRow={wholeRow(rowsByCode['shelf_life_basis'])}
            handlingRow={wholeRow(rowsByCode['handling_note'])}
            onChange={onChange}
            onSave={() => onSaveBundle(OPS_KEPT_CODES, 'ops-kept')}
            onClearError={onClearStoryError}
          />
        ) : (
          <p className="tx-ops__empty">No storage fields in the registry.</p>
        )}
      </Room>
    </div>
  )
}

function Room({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string
  title: string
  lede: string
  children: ReactNode
}) {
  return (
    <section className="tx-ops__room">
      <header className="tx-ops__room-head">
        <p className="tx-ops__room-kicker">{kicker}</p>
        <h4 className="tx-ops__room-title">{title}</h4>
        <p className="tx-ops__room-lede">{lede}</p>
      </header>
      {children}
    </section>
  )
}

function MadeKeptEditor(
  props:
    | {
        kind: 'made'
        canEdit: boolean
        saving: boolean
        error: string | null
        methodField?: ProofSubMetricRow
        paramField?: ProofSubMetricRow
        methodRow?: OpsLocalRow
        paramRow?: OpsLocalRow
        storageField?: undefined
        shelfField?: undefined
        handlingField?: undefined
        storageRow?: undefined
        shelfRow?: undefined
        handlingRow?: undefined
        onChange: Props['onChange']
        onSave: () => void
        onClearError?: () => void
      }
    | {
        kind: 'kept'
        canEdit: boolean
        saving: boolean
        error: string | null
        methodField?: undefined
        paramField?: undefined
        methodRow?: undefined
        paramRow?: undefined
        storageField?: ProofSubMetricRow
        shelfField?: ProofSubMetricRow
        handlingField?: ProofSubMetricRow
        storageRow?: OpsLocalRow
        shelfRow?: OpsLocalRow
        handlingRow?: OpsLocalRow
        onChange: Props['onChange']
        onSave: () => void
        onClearError?: () => void
      },
) {
  const anchor =
    props.kind === 'made'
      ? (props.methodRow?.draft ?? props.paramRow?.draft)
      : (props.storageRow?.draft ?? props.shelfRow?.draft ?? props.handlingRow?.draft)

  const preview =
    props.kind === 'made'
      ? composeMadeLine(props.methodRow?.draft.valueText, props.paramRow?.draft.valueText)
      : composeKeptLine(
          props.storageRow?.draft.valueText,
          props.shelfRow?.draft.valueText,
          props.handlingRow?.draft.valueText,
        )

  const patchWhole = (field: ProofSubMetricRow, row: OpsLocalRow | undefined, partial: Partial<DisclosureDraft>) => {
    if (!row) return
    props.onClearError?.()
    props.onChange(field.sub_metric_code, row.key, {
      ...row.draft,
      status: 'disclosed',
      ...partial,
    })
  }

  const patchSharedMeta = (partial: Partial<DisclosureDraft>) => {
    props.onClearError?.()
    if (props.kind === 'made') {
      if (props.methodField && props.methodRow) {
        patchWhole(props.methodField, props.methodRow, partial)
      }
      if (props.paramField && props.paramRow) {
        patchWhole(props.paramField, props.paramRow, partial)
      }
      return
    }
    if (props.storageField && props.storageRow) {
      patchWhole(props.storageField, props.storageRow, partial)
    }
    if (props.shelfField && props.shelfRow) {
      patchWhole(props.shelfField, props.shelfRow, partial)
    }
    if (props.handlingField && props.handlingRow) {
      patchWhole(props.handlingField, props.handlingRow, partial)
    }
  }

  const presence = rowPresence(anchor ?? null)
  const canSave = Boolean(preview)

  const provClass =
    (anchor?.sourceTier ?? 'brand_stated') === 'third_party_verified'
      ? 'tx-prov tx-prov--verified'
      : (anchor?.sourceTier ?? 'brand_stated') === 'brand_document'
        ? 'tx-prov tx-prov--document'
        : 'tx-prov tx-prov--stated'

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
      </div>

      {preview ? (
        <div style={{ marginBottom: 12 }}>
          <ShopperPreview
            line={preview}
            whisper={provenanceWhisperFromTier({
              status: 'disclosed',
              sourceTier: anchor?.sourceTier,
              issuerName: anchor?.issuerName,
            })}
          />
        </div>
      ) : null}

      {props.kind === 'made' ? (
        <>
          {props.methodField && props.methodRow ? (
            <div className="tx-field">
              <div className="tx-label">Process method</div>
              <select
                className="tx-control"
                disabled={!props.canEdit}
                value={props.methodRow.draft.valueText ?? ''}
                onChange={(e) =>
                  patchWhole(props.methodField!, props.methodRow, {
                    valueText: e.target.value || null,
                  })
                }
              >
                <option value="">Select…</option>
                {(props.methodField.allowed_values ?? []).map((code) => (
                  <option key={code} value={code}>
                    {formatProofCode(code)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {props.paramField && props.paramRow ? (
            <div className="tx-field">
              <div className="tx-label">Parameter (optional)</div>
              <input
                className="tx-control"
                disabled={!props.canEdit}
                placeholder="e.g. 48-hour ferment, 180°C / 12 min"
                value={props.paramRow.draft.valueText ?? ''}
                onChange={(e) =>
                  patchWhole(props.paramField!, props.paramRow, {
                    valueText: e.target.value || null,
                  })
                }
              />
            </div>
          ) : null}
        </>
      ) : (
        <>
          {props.storageField && props.storageRow ? (
            <div className="tx-field">
              <div className="tx-label">Storage</div>
              <select
                className="tx-control"
                disabled={!props.canEdit}
                value={props.storageRow.draft.valueText ?? ''}
                onChange={(e) =>
                  patchWhole(props.storageField!, props.storageRow, {
                    valueText: e.target.value || null,
                  })
                }
              >
                <option value="">Select…</option>
                {(props.storageField.allowed_values ?? []).map((code) => (
                  <option key={code} value={code}>
                    {formatProofCode(code)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {props.shelfField && props.shelfRow ? (
            <div className="tx-field">
              <div className="tx-label">On-pack date means</div>
              <select
                className="tx-control"
                disabled={!props.canEdit}
                value={props.shelfRow.draft.valueText ?? ''}
                onChange={(e) =>
                  patchWhole(props.shelfField!, props.shelfRow, {
                    valueText: e.target.value || null,
                  })
                }
              >
                <option value="">Select…</option>
                {(props.shelfField.allowed_values ?? []).map((code) => (
                  <option key={code} value={code}>
                    {formatProofCode(code)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {props.handlingField && props.handlingRow ? (
            <div className="tx-field">
              <div className="tx-label">After opening</div>
              <input
                className="tx-control"
                disabled={!props.canEdit}
                placeholder="e.g. Refrigerate and use within 7 days"
                value={props.handlingRow.draft.valueText ?? ''}
                onChange={(e) =>
                  patchWhole(props.handlingField!, props.handlingRow, {
                    valueText: e.target.value || null,
                  })
                }
              />
            </div>
          ) : null}
        </>
      )}

      <div key={anchor?.sourceTier ?? 'brand_stated'} className={provClass}>
        <p className="tx-prov__eyebrow">Provenance</p>
        <div className="tx-tiers">
          {SOURCE_TIERS.map((tier) => (
            <label
              key={tier.value}
              className={`tx-tier${
                (anchor?.sourceTier ?? 'brand_stated') === tier.value ? ' tx-tier--active' : ''
              }${!props.canEdit ? ' tx-tier--disabled' : ''}`}
            >
              <input
                type="radio"
                name={`ops-${props.kind}-tier`}
                checked={(anchor?.sourceTier ?? 'brand_stated') === tier.value}
                disabled={!props.canEdit}
                onChange={() =>
                  patchSharedMeta({
                    sourceTier: tier.value,
                    sourceUrl: tier.value === 'brand_stated' ? null : (anchor?.sourceUrl ?? null),
                    issuerName:
                      tier.value === 'third_party_verified' ? (anchor?.issuerName ?? null) : null,
                    credentialId:
                      tier.value === 'third_party_verified'
                        ? (anchor?.credentialId ?? null)
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
        {(anchor?.sourceTier ?? 'brand_stated') !== 'brand_stated' ? (
          <div className="tx-field">
            <div className="tx-label">Source URL</div>
            <input
              type="url"
              className="tx-control"
              disabled={!props.canEdit}
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
                  disabled={!props.canEdit}
                  value={anchor?.issuerName ?? ''}
                  onChange={(e) => patchSharedMeta({ issuerName: e.target.value || null })}
                />
              </div>
              <div>
                <div className="tx-label">Credential ID</div>
                <input
                  className="tx-control"
                  disabled={!props.canEdit}
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
            disabled={!props.canEdit}
            value={anchor?.asofDate ?? new Date().toISOString().slice(0, 10)}
            onChange={(e) => patchSharedMeta({ asofDate: e.target.value })}
          />
        </div>
      </div>

      <div className="tx-footer" style={{ marginTop: 0 }}>
        <label className="tx-publish">
          <input
            type="checkbox"
            checked={anchor?.published ?? false}
            disabled={!props.canEdit || !canSave}
            onChange={(e) => patchSharedMeta({ published: e.target.checked })}
          />
          <span>
            <span className="tx-publish__label">Show to shoppers</span>
          </span>
        </label>
        {props.canEdit ? (
          <button
            type="button"
            className="tx-btn tx-btn--primary"
            disabled={props.saving || !canSave}
            onClick={props.onSave}
          >
            {props.saving ? 'Saving…' : props.kind === 'made' ? 'Save making story' : 'Save keeping story'}
          </button>
        ) : null}
      </div>
      {props.error ? <p className="tx-error">{props.error}</p> : null}
    </div>
  )
}

function WholeEnumCard({
  title,
  hint,
  field,
  row,
  canEdit,
  saving,
  error,
  onChange,
  onSave,
}: {
  title: string
  hint: string
  field: ProofSubMetricRow
  row: OpsLocalRow | undefined
  canEdit: boolean
  saving: boolean
  error: string | null
  onChange: Props['onChange']
  onSave: (field: ProofSubMetricRow, row: OpsLocalRow) => void
}) {
  if (!row) return null
  const presence = rowPresence(row.draft)
  const summary = row.draft.valueText ? formatProofCode(row.draft.valueText) : '—'

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">{title}</p>
          <p className="tx-ops__card-hint">{hint}</p>
        </div>
        <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
      </div>
      <p className="tx-ops__card-summary">{summary}</p>
      <div className="tx-field">
        <div className="tx-label">Value</div>
        <select
          className="tx-control"
          disabled={!canEdit}
          value={row.draft.valueText ?? ''}
          onChange={(e) =>
            onChange(field.sub_metric_code, row.key, {
              ...row.draft,
              status: 'disclosed',
              valueText: e.target.value || null,
            })
          }
        >
          <option value="">Select…</option>
          {(field.allowed_values ?? []).map((code) => (
            <option key={code} value={code}>
              {formatProofCode(code)}
            </option>
          ))}
        </select>
      </div>
      <label className="tx-publish" style={{ marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={row.draft.published}
          disabled={!canEdit}
          onChange={(e) =>
            onChange(field.sub_metric_code, row.key, {
              ...row.draft,
              published: e.target.checked,
            })
          }
        />
        <span>
          <span className="tx-publish__label">Show to shoppers</span>
        </span>
      </label>
      <div className="tx-field">
        <div className="tx-label">As of</div>
        <input
          type="date"
          className="tx-control tx-control--date"
          disabled={!canEdit}
          value={row.draft.asofDate}
          onChange={(e) =>
            onChange(field.sub_metric_code, row.key, {
              ...row.draft,
              asofDate: e.target.value,
            })
          }
        />
      </div>
      {canEdit ? (
        <button
          type="button"
          className="tx-btn tx-btn--primary"
          disabled={saving || !row.draft.valueText}
          onClick={() => onSave(field, row)}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      ) : null}
      {error ? <p className="tx-error">{error}</p> : null}
    </div>
  )
}

function RefinementSheet({
  field,
  lines,
  rows,
  canEdit,
  savingKey,
  errors,
  onChange,
  onEnsureRow,
  onSave,
}: {
  field: ProofSubMetricRow
  lines: LabelLine[]
  rows: OpsLocalRow[]
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  onChange: Props['onChange']
  onEnsureRow: Props['onEnsureRow']
  onSave: (field: ProofSubMetricRow, row: OpsLocalRow) => void
}) {
  const [openName, setOpenName] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')

  return (
    <div className="tx-ops__sub">
      <p className="tx-ops__sub-title">Oil &amp; fat refinement</p>
      <p className="tx-ops__sub-lede">
        Codex states for named oils and fats. Seeded from oil-like ingredients on the label.
      </p>
      <div className="tx-formula__sheet">
        <div className="tx-ops__sheet-head" aria-hidden>
          <span>Ingredient</span>
          <span>State</span>
          <span>Status</span>
        </div>
        {lines.length === 0 ? (
          <div className="tx-formula__empty">
            No oils or fats detected on the label. Add one to disclose refinement.
          </div>
        ) : (
          lines.map((line) => {
            const row = findSubjectRow(rows, line.name)
            const open = openName === line.name
            const presence = row ? rowPresence(row.draft) : 'not_started'
            const state = row?.draft.valueText ? formatProofCode(row.draft.valueText) : '—'
            return (
              <div
                key={norm(line.name)}
                className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
              >
                <button
                  type="button"
                  className="tx-ops__sheet-hit"
                  onClick={() => setOpenName(open ? null : line.name)}
                  aria-expanded={open}
                >
                  <span className="tx-formula__name">
                    <span className="tx-formula__name-text">{line.display}</span>
                    {!line.fromLabel ? (
                      <span className="tx-formula__tag">Not on label</span>
                    ) : null}
                  </span>
                  <span className="tx-origin__place">{state}</span>
                  <span className="tx-formula__status">
                    <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
                    <span className="tx-row__chev" aria-hidden>
                      ›
                    </span>
                  </span>
                </button>
                {open ? (
                  <div className="tx-formula__editor">
                    <SubjectEnumEditor
                      field={field}
                      subject={line.name}
                      row={row}
                      canEdit={canEdit}
                      saving={row != null && savingKey === row.key}
                      error={row ? errors[row.key] ?? null : null}
                      onEnsureRow={onEnsureRow}
                      onChange={onChange}
                      onSave={onSave}
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
                placeholder="e.g. Olive oil"
                autoFocus
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const name = customName.trim()
                    if (!name) return
                    onEnsureRow(field, name)
                    setCustomName('')
                    setShowAdd(false)
                    setOpenName(name)
                  }
                }}
              />
              <button
                type="button"
                className="tx-btn tx-btn--primary"
                onClick={() => {
                  const name = customName.trim()
                  if (!name) return
                  onEnsureRow(field, name)
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
              Oil or fat not on the label
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function FlavorSheet({
  field,
  lines,
  rows,
  canEdit,
  savingKey,
  errors,
  onChange,
  onEnsureRow,
  onSave,
}: {
  field: ProofSubMetricRow
  lines: LabelLine[]
  rows: OpsLocalRow[]
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  onChange: Props['onChange']
  onEnsureRow: Props['onEnsureRow']
  onSave: (field: ProofSubMetricRow, row: OpsLocalRow) => void
}) {
  const [openName, setOpenName] = useState<string | null>(lines[0]?.name ?? null)
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')

  return (
    <div className="tx-ops__sub">
      <p className="tx-ops__sub-title">Natural flavor breakout</p>
      <p className="tx-ops__sub-lede">
        When the label says “natural flavors,” say what they actually are — or choose not to.
      </p>
      {lines.length === 0 ? (
        <div className="tx-ops__card">
          <p className="tx-ops__card-hint" style={{ marginBottom: 12 }}>
            No “natural flavors” phrase on this SKU’s ingredient statement.
          </p>
          {canEdit ? (
            showAdd ? (
              <div className="tx-formula__add-form">
                <input
                  className="tx-control"
                  value={customName}
                  placeholder="e.g. Natural flavors"
                  autoFocus
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <button
                  type="button"
                  className="tx-btn tx-btn--primary"
                  onClick={() => {
                    const name = customName.trim() || 'Natural flavors'
                    onEnsureRow(field, name)
                    setCustomName('')
                    setShowAdd(false)
                    setOpenName(name)
                  }}
                >
                  Add
                </button>
              </div>
            ) : (
              <button type="button" className="tx-add" onClick={() => setShowAdd(true)}>
                Disclose a flavor breakout
              </button>
            )
          ) : null}
        </div>
      ) : (
        <div className="tx-formula__sheet">
          {lines.map((line) => {
            const row = findSubjectRow(rows, line.name)
            const open = openName === line.name
            const presence = row ? rowPresence(row.draft) : 'not_started'
            return (
              <div
                key={norm(line.name)}
                className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
              >
                <button
                  type="button"
                  className="tx-ops__flavor-hit"
                  onClick={() => setOpenName(open ? null : line.name)}
                  aria-expanded={open}
                >
                  <span className="tx-formula__name-text">{line.display}</span>
                  <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
                </button>
                {open ? (
                  <div className="tx-formula__editor">
                    <SubjectTextEditor
                      field={field}
                      subject={line.name}
                      row={row}
                      canEdit={canEdit}
                      saving={row != null && savingKey === row.key}
                      error={row ? errors[row.key] ?? null : null}
                      placeholder="e.g. orange oil, vanilla extract"
                      onEnsureRow={onEnsureRow}
                      onChange={onChange}
                      onSave={onSave}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AidSheet({
  field,
  rows,
  canEdit,
  savingKey,
  errors,
  onChange,
  onEnsureRow,
  onSave,
}: {
  field: ProofSubMetricRow
  rows: OpsLocalRow[]
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  onChange: Props['onChange']
  onEnsureRow: Props['onEnsureRow']
  onSave: (field: ProofSubMetricRow, row: OpsLocalRow) => void
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')

  const started = rows.filter((r) => (r.draft.subjectLabel ?? '').trim())

  return (
    <div className="tx-ops__sub">
      <p className="tx-ops__sub-title">Processing aids</p>
      <p className="tx-ops__sub-lede">
        Aids used in making that aren’t required on the ingredient list.
      </p>
      {started.length === 0 ? (
        <div className="tx-ops__card">
          <p className="tx-ops__card-hint" style={{ marginBottom: 12 }}>
            None disclosed yet.
          </p>
        </div>
      ) : (
        <div className="tx-formula__sheet">
          {started.map((row) => {
            const open = openKey === row.key
            const presence = rowPresence(row.draft)
            return (
              <div
                key={row.key}
                className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
              >
                <button
                  type="button"
                  className="tx-ops__flavor-hit"
                  onClick={() => setOpenKey(open ? null : row.key)}
                  aria-expanded={open}
                >
                  <span className="tx-formula__name-text">
                    {row.draft.subjectLabel || 'Processing aid'}
                  </span>
                  <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
                </button>
                {open ? (
                  <div className="tx-formula__editor">
                    <SubjectTextEditor
                      field={field}
                      subject={row.draft.subjectLabel ?? ''}
                      row={row}
                      canEdit={canEdit}
                      saving={savingKey === row.key}
                      error={errors[row.key] ?? null}
                      placeholder="What the aid is / how it’s used"
                      onEnsureRow={onEnsureRow}
                      onChange={onChange}
                      onSave={onSave}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
      {canEdit ? (
        <div className="tx-formula__add">
          {showAdd ? (
            <div className="tx-formula__add-form">
              <input
                className="tx-control"
                value={customName}
                placeholder="e.g. Silicon dioxide"
                autoFocus
                onChange={(e) => setCustomName(e.target.value)}
              />
              <button
                type="button"
                className="tx-btn tx-btn--primary"
                onClick={() => {
                  const name = customName.trim()
                  if (!name) return
                  const key = onEnsureRow(field, name)
                  setCustomName('')
                  setShowAdd(false)
                  setOpenKey(key)
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
              Add a processing aid
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function SubjectEnumEditor({
  field,
  subject,
  row,
  canEdit,
  saving,
  error,
  onEnsureRow,
  onChange,
  onSave,
}: {
  field: ProofSubMetricRow
  subject: string
  row: OpsLocalRow | undefined
  canEdit: boolean
  saving: boolean
  error: string | null
  onEnsureRow: Props['onEnsureRow']
  onChange: Props['onChange']
  onSave: (field: ProofSubMetricRow, row: OpsLocalRow) => void
}) {
  const patch = (partial: Partial<DisclosureDraft>) => {
    let key = row?.key
    let base = row?.draft
    if (!key || !base) {
      key = onEnsureRow(field, subject)
      base = blankDraft(field, {
        subjectKind: 'ingredient',
        subjectLabel: subject,
        status: 'disclosed',
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

  return (
    <div className="tx-formula__block">
      <p className="tx-formula__block-title">Refinement of {subject}</p>
      <div className="tx-field">
        <div className="tx-label">State</div>
        <select
          className="tx-control"
          disabled={!canEdit}
          value={row?.draft.valueText ?? ''}
          onChange={(e) => patch({ valueText: e.target.value || null })}
        >
          <option value="">Select…</option>
          {(field.allowed_values ?? []).map((code) => (
            <option key={code} value={code}>
              {formatProofCode(code)}
            </option>
          ))}
        </select>
      </div>
      {row ? (
        <>
          <label className="tx-publish" style={{ margin: '12px 0' }}>
            <input
              type="checkbox"
              checked={row.draft.published}
              disabled={!canEdit}
              onChange={(e) => patch({ published: e.target.checked })}
            />
            <span>
              <span className="tx-publish__label">Show to shoppers</span>
            </span>
          </label>
          <div className="tx-field">
            <div className="tx-label">As of</div>
            <input
              type="date"
              className="tx-control tx-control--date"
              disabled={!canEdit}
              value={row.draft.asofDate}
              onChange={(e) => patch({ asofDate: e.target.value })}
            />
          </div>
          {canEdit ? (
            <button
              type="button"
              className="tx-btn tx-btn--primary"
              disabled={saving || !row.draft.valueText}
              onClick={() => onSave(field, row)}
            >
              {saving ? 'Saving…' : 'Save refinement'}
            </button>
          ) : null}
          {error ? <p className="tx-error">{error}</p> : null}
        </>
      ) : (
        <p className="tx-formula__block-hint">Choose a state to create a disclosure.</p>
      )}
    </div>
  )
}

function SubjectTextEditor({
  field,
  subject,
  row,
  canEdit,
  saving,
  error,
  placeholder,
  onEnsureRow,
  onChange,
  onSave,
}: {
  field: ProofSubMetricRow
  subject: string
  row: OpsLocalRow | undefined
  canEdit: boolean
  saving: boolean
  error: string | null
  placeholder: string
  onEnsureRow: Props['onEnsureRow']
  onChange: Props['onChange']
  onSave: (field: ProofSubMetricRow, row: OpsLocalRow) => void
}) {
  const patch = (partial: Partial<DisclosureDraft>) => {
    let key = row?.key
    let base = row?.draft
    if (!key || !base) {
      key = onEnsureRow(field, subject)
      base = blankDraft(field, {
        subjectKind: 'ingredient',
        subjectLabel: subject,
        status: 'disclosed',
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

  return (
    <div className="tx-formula__block">
      <textarea
        className="tx-control tx-formula__textarea"
        rows={3}
        disabled={!canEdit}
        placeholder={placeholder}
        value={row?.draft.valueText ?? ''}
        onChange={(e) => patch({ valueText: e.target.value || null })}
      />
      {row ? (
        <>
          <label className="tx-publish" style={{ margin: '12px 0' }}>
            <input
              type="checkbox"
              checked={row.draft.published}
              disabled={!canEdit}
              onChange={(e) => patch({ published: e.target.checked })}
            />
            <span>
              <span className="tx-publish__label">Show to shoppers</span>
            </span>
          </label>
          <div className="tx-field">
            <div className="tx-label">As of</div>
            <input
              type="date"
              className="tx-control tx-control--date"
              disabled={!canEdit}
              value={row.draft.asofDate}
              onChange={(e) => patch({ asofDate: e.target.value })}
            />
          </div>
          {canEdit ? (
            <button
              type="button"
              className="tx-btn tx-btn--primary"
              disabled={saving || !row.draft.valueText?.trim()}
              onClick={() => onSave(field, row)}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          ) : null}
          {error ? <p className="tx-error">{error}</p> : null}
        </>
      ) : null}
    </div>
  )
}
