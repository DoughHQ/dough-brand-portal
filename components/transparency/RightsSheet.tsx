'use client'

import { type ReactNode } from 'react'
import {
  type DisclosureDraft,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence, type RowPresence } from '@/lib/transparency/proofChapters'
import {
  composeDiligenceLine,
  composeGrievanceLine,
  composeLaborLine,
  composeLivingLine,
  composeSocialCertLine,
  composeSupplierLine,
  provenanceWhisperFromTier,
} from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'

export const RIGHTS_LIVING_CODES = [
  'animal_welfare_standard',
  'antibiotic_hormone_policy',
] as const

export const RIGHTS_LABOR_CODES = [
  'labor_standard_alignment',
  'labor_policy_scope',
] as const

export const RIGHTS_CERT_CODES = ['social_certification'] as const

export const RIGHTS_DILIGENCE_CODES = [
  'forced_labor_due_diligence',
  'high_risk_geography_policy',
  'remediation_commitment',
] as const

export const RIGHTS_GRIEVANCE_CODES = ['grievance_mechanism_type'] as const

export const RIGHTS_SUPPLIER_CODES = [
  'supplier_disclosure_depth',
  'supplier_disclosure_coverage_pct',
] as const

/** Ingredient-level — stay inventory below the composed rooms. */
export const RIGHTS_RISK_METRIC = 'sourcing_risk'

export type RightsLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

type Props = {
  fieldsByCode: Record<string, ProofSubMetricRow | undefined>
  rowsByCode: Record<string, RightsLocalRow[]>
  canEdit: boolean
  savingKey: string | null
  storyError: string | null
  errors: Record<string, string>
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onSaveRow: (field: ProofSubMetricRow, row: RightsLocalRow) => void
  onSaveBundle: (codes: readonly string[], bundleKey: string) => void
  onClearStoryError?: () => void
}

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

function wholeRow(rows: RightsLocalRow[] | undefined): RightsLocalRow | undefined {
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

function disclosedText(row: RightsLocalRow | undefined): string | null {
  if (!row || row.draft.status !== 'disclosed') return null
  return row.draft.valueText
}

function disclosedNum(row: RightsLocalRow | undefined): number | null {
  if (!row || row.draft.status !== 'disclosed') return null
  return row.draft.valueNum
}

export default function RightsSheet({
  fieldsByCode,
  rowsByCode,
  canEdit,
  savingKey,
  storyError,
  errors,
  onChange,
  onSaveRow,
  onSaveBundle,
  onClearStoryError,
}: Props) {
  const welfareField = fieldsByCode['animal_welfare_standard']
  const antibioticField = fieldsByCode['antibiotic_hormone_policy']
  const laborField = fieldsByCode['labor_standard_alignment']
  const scopeField = fieldsByCode['labor_policy_scope']
  const certField = fieldsByCode['social_certification']
  const diligenceField = fieldsByCode['forced_labor_due_diligence']
  const geoField = fieldsByCode['high_risk_geography_policy']
  const remediationField = fieldsByCode['remediation_commitment']
  const grievanceField = fieldsByCode['grievance_mechanism_type']
  const depthField = fieldsByCode['supplier_disclosure_depth']
  const coverageField = fieldsByCode['supplier_disclosure_coverage_pct']

  const welfareRow = wholeRow(rowsByCode['animal_welfare_standard'])
  const antibioticRow = wholeRow(rowsByCode['antibiotic_hormone_policy'])
  const laborRow = wholeRow(rowsByCode['labor_standard_alignment'])
  const scopeRow = wholeRow(rowsByCode['labor_policy_scope'])
  const certRow = wholeRow(rowsByCode['social_certification'])
  const diligenceRow = wholeRow(rowsByCode['forced_labor_due_diligence'])
  const geoRow = wholeRow(rowsByCode['high_risk_geography_policy'])
  const remediationRow = wholeRow(rowsByCode['remediation_commitment'])
  const grievanceRow = wholeRow(rowsByCode['grievance_mechanism_type'])
  const depthRow = wholeRow(rowsByCode['supplier_disclosure_depth'])
  const coverageRow = wholeRow(rowsByCode['supplier_disclosure_coverage_pct'])

  return (
    <div className="tx-ops">
      <div className="tx-formula__banner">
        <p className="tx-formula__banner-text">
          Living things, people, and who you name — claims you can stand behind, not slogans.
        </p>
      </div>

      {storyError ? <p className="tx-error">{storyError}</p> : null}

      <Room
        kicker="Living things"
        title="Animals in this product"
        lede="Welfare standard and antibiotic or hormone policy — only when animals are part of the story."
      >
        {welfareField || antibioticField ? (
          <LivingEditor
            canEdit={canEdit}
            saving={savingKey === 'rights-living'}
            welfareField={welfareField}
            antibioticField={antibioticField}
            welfareRow={welfareRow}
            antibioticRow={antibioticRow}
            onChange={onChange}
            onSave={() => onSaveBundle(RIGHTS_LIVING_CODES, 'rights-living')}
            onClearError={onClearStoryError}
          />
        ) : (
          <p className="tx-ops__empty">No animal-welfare fields in the registry.</p>
        )}
      </Room>

      <Room
        kicker="People"
        title="Labor, certifications, diligence"
        lede="How far the code reaches, what you’ve earned, and what you do when something goes wrong."
      >
        <div className="tx-ops__stack">
          {laborField || scopeField ? (
            <LaborEditor
              canEdit={canEdit}
              saving={savingKey === 'rights-labor'}
              laborField={laborField}
              scopeField={scopeField}
              laborRow={laborRow}
              scopeRow={scopeRow}
              onChange={onChange}
              onSave={() => onSaveBundle(RIGHTS_LABOR_CODES, 'rights-labor')}
              onClearError={onClearStoryError}
            />
          ) : null}

          {certField && certRow ? (
            <SingleEnumCard
              title="Social certification"
              hint="A certification held for this product or brand — prefer a document or verification."
              field={certField}
              row={certRow}
              canEdit={canEdit}
              saving={savingKey === certRow.key || savingKey === 'rights-cert'}
              error={errors[certRow.key] ?? null}
              previewLine={composeSocialCertLine(disclosedText(certRow))}
              onChange={onChange}
              onSave={() => onSaveRow(certField, certRow)}
            />
          ) : null}

          {diligenceField || geoField || remediationField ? (
            <DiligenceEditor
              canEdit={canEdit}
              saving={savingKey === 'rights-diligence'}
              diligenceField={diligenceField}
              geoField={geoField}
              remediationField={remediationField}
              diligenceRow={diligenceRow}
              geoRow={geoRow}
              remediationRow={remediationRow}
              onChange={onChange}
              onSave={() => onSaveBundle(RIGHTS_DILIGENCE_CODES, 'rights-diligence')}
              onClearError={onClearStoryError}
            />
          ) : null}

          {grievanceField && grievanceRow ? (
            <SingleTextCard
              title="Grievance channel"
              hint="How workers can raise concerns — in your own words."
              field={grievanceField}
              row={grievanceRow}
              canEdit={canEdit}
              saving={savingKey === grievanceRow.key}
              error={errors[grievanceRow.key] ?? null}
              placeholder="e.g. Independent hotline operated by…"
              previewLine={composeGrievanceLine(disclosedText(grievanceRow))}
              onChange={onChange}
              onSave={() => onSaveRow(grievanceField, grievanceRow)}
            />
          ) : null}

          {!laborField &&
          !scopeField &&
          !certField &&
          !diligenceField &&
          !geoField &&
          !remediationField &&
          !grievanceField ? (
            <p className="tx-ops__empty">No people fields in the registry.</p>
          ) : null}
        </div>
      </Room>

      <Room
        kicker="Named suppliers"
        title="How far you name them"
        lede="Depth of the published supplier list and how much volume it covers."
      >
        {depthField || coverageField ? (
          <SupplierEditor
            canEdit={canEdit}
            saving={savingKey === 'rights-supplier'}
            depthField={depthField}
            coverageField={coverageField}
            depthRow={depthRow}
            coverageRow={coverageRow}
            onChange={onChange}
            onSave={() => onSaveBundle(RIGHTS_SUPPLIER_CODES, 'rights-supplier')}
            onClearError={onClearStoryError}
          />
        ) : (
          <p className="tx-ops__empty">No supplier-visibility fields in the registry.</p>
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

function ProvenanceFields({
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

function patchShared(
  rows: Array<{ field: ProofSubMetricRow; row: RightsLocalRow } | null | undefined>,
  patch: Partial<DisclosureDraft>,
  onChange: Props['onChange'],
) {
  for (const item of rows) {
    if (!item) continue
    onChange(item.field.sub_metric_code, item.row.key, {
      ...item.row.draft,
      ...patch,
      status: 'disclosed',
    })
  }
}

function LivingEditor({
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
  onChange: Props['onChange']
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
        <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
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

function LaborEditor({
  canEdit,
  saving,
  laborField,
  scopeField,
  laborRow,
  scopeRow,
  onChange,
  onSave,
  onClearError,
}: {
  canEdit: boolean
  saving: boolean
  laborField?: ProofSubMetricRow
  scopeField?: ProofSubMetricRow
  laborRow?: RightsLocalRow
  scopeRow?: RightsLocalRow
  onChange: Props['onChange']
  onSave: () => void
  onClearError?: () => void
}) {
  const line = composeLaborLine({
    standard: disclosedText(laborRow),
    scope: disclosedText(scopeRow),
  })
  const anchor = laborRow?.draft ?? scopeRow?.draft
  const presence = rowPresence(anchor ?? null)
  const canSave = Boolean(disclosedText(laborRow) || disclosedText(scopeRow))
  const shared = [
    laborField && laborRow ? { field: laborField, row: laborRow } : null,
    scopeField && scopeRow ? { field: scopeField, row: scopeRow } : null,
  ]

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">Labor code</p>
          <p className="tx-ops__card-hint">What you align to, and how far down the chain it reaches.</p>
        </div>
        <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
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
        {laborField && laborRow ? (
          <div className="tx-field">
            <div className="tx-label">Labor standard</div>
            <select
              className="tx-control"
              disabled={!canEdit}
              value={laborRow.draft.valueText ?? ''}
              onChange={(e) => {
                onClearError?.()
                onChange(laborField.sub_metric_code, laborRow.key, {
                  ...laborRow.draft,
                  status: 'disclosed',
                  valueText: e.target.value || null,
                })
              }}
            >
              <option value="">Select…</option>
              {(laborField.allowed_values ?? []).map((code) => (
                <option key={code} value={code}>
                  {formatProofCode(code)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {scopeField && scopeRow ? (
          <div className="tx-field">
            <div className="tx-label">Policy scope</div>
            <select
              className="tx-control"
              disabled={!canEdit}
              value={scopeRow.draft.valueText ?? ''}
              onChange={(e) => {
                onClearError?.()
                onChange(scopeField.sub_metric_code, scopeRow.key, {
                  ...scopeRow.draft,
                  status: 'disclosed',
                  valueText: e.target.value || null,
                })
              }}
            >
              <option value="">Select…</option>
              {(scopeField.allowed_values ?? []).map((code) => (
                <option key={code} value={code}>
                  {formatProofCode(code)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <ProvenanceFields
        name="rights-labor-tier"
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
            {saving ? 'Saving…' : 'Save labor code'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function DiligenceEditor({
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
  onChange: Props['onChange']
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
        <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
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

function SupplierEditor({
  canEdit,
  saving,
  depthField,
  coverageField,
  depthRow,
  coverageRow,
  onChange,
  onSave,
  onClearError,
}: {
  canEdit: boolean
  saving: boolean
  depthField?: ProofSubMetricRow
  coverageField?: ProofSubMetricRow
  depthRow?: RightsLocalRow
  coverageRow?: RightsLocalRow
  onChange: Props['onChange']
  onSave: () => void
  onClearError?: () => void
}) {
  const line = composeSupplierLine({
    depth: disclosedText(depthRow),
    coveragePct: disclosedNum(coverageRow),
  })
  const anchor = depthRow?.draft ?? coverageRow?.draft
  const presence = rowPresence(anchor ?? null)
  const canSave = Boolean(disclosedText(depthRow) || disclosedNum(coverageRow) != null)
  const shared = [
    depthField && depthRow ? { field: depthField, row: depthRow } : null,
    coverageField && coverageRow ? { field: coverageField, row: coverageRow } : null,
  ]

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">Supplier list claim</p>
          <p className="tx-ops__card-hint">Depth of naming, and coverage of spend or volume.</p>
        </div>
        <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
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
        {depthField && depthRow ? (
          <div className="tx-field">
            <div className="tx-label">Disclosure depth</div>
            <select
              className="tx-control"
              disabled={!canEdit}
              value={depthRow.draft.valueText ?? ''}
              onChange={(e) => {
                onClearError?.()
                onChange(depthField.sub_metric_code, depthRow.key, {
                  ...depthRow.draft,
                  status: 'disclosed',
                  valueText: e.target.value || null,
                })
              }}
            >
              <option value="">Select…</option>
              {(depthField.allowed_values ?? []).map((code) => (
                <option key={code} value={code}>
                  {formatProofCode(code)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {coverageField && coverageRow ? (
          <div className="tx-field">
            <div className="tx-label">Coverage %</div>
            <input
              type="number"
              className="tx-control"
              disabled={!canEdit}
              min={0}
              max={100}
              step={0.1}
              placeholder="e.g. 80"
              value={coverageRow.draft.valueNum ?? ''}
              onChange={(e) => {
                onClearError?.()
                const raw = e.target.value
                onChange(coverageField.sub_metric_code, coverageRow.key, {
                  ...coverageRow.draft,
                  status: 'disclosed',
                  valueNum: raw === '' ? null : Number(raw),
                  valueUnit: coverageField.unit ?? 'percent',
                })
              }}
            />
          </div>
        ) : null}
      </div>
      <ProvenanceFields
        name="rights-supplier-tier"
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
            {saving ? 'Saving…' : 'Save supplier claim'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function SingleEnumCard({
  title,
  hint,
  field,
  row,
  canEdit,
  saving,
  error,
  previewLine,
  onChange,
  onSave,
}: {
  title: string
  hint: string
  field: ProofSubMetricRow
  row: RightsLocalRow
  canEdit: boolean
  saving: boolean
  error: string | null
  previewLine: string
  onChange: Props['onChange']
  onSave: () => void
}) {
  const presence = rowPresence(row.draft)
  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">{title}</p>
          <p className="tx-ops__card-hint">{hint}</p>
        </div>
        <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
      </div>
      <ShopperPreview
        line={previewLine}
        whisper={provenanceWhisperFromTier({
          status: row.draft.status,
          sourceTier: row.draft.sourceTier,
          issuerName: row.draft.issuerName,
        })}
      />
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
      <ProvenanceFields
        name={`rights-single-${field.sub_metric_code}`}
        anchor={row.draft}
        canEdit={canEdit}
        onPatch={(patch) =>
          onChange(field.sub_metric_code, row.key, { ...row.draft, ...patch })
        }
      />
      <div className="tx-footer" style={{ marginTop: 0 }}>
        <label className="tx-publish">
          <input
            type="checkbox"
            checked={row.draft.published}
            disabled={!canEdit || !row.draft.valueText}
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
        {canEdit ? (
          <button
            type="button"
            className="tx-btn tx-btn--primary"
            disabled={saving || !row.draft.valueText}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : null}
      </div>
      {error ? <p className="tx-error">{error}</p> : null}
    </div>
  )
}

function SingleTextCard({
  title,
  hint,
  field,
  row,
  canEdit,
  saving,
  error,
  placeholder,
  previewLine,
  onChange,
  onSave,
}: {
  title: string
  hint: string
  field: ProofSubMetricRow
  row: RightsLocalRow
  canEdit: boolean
  saving: boolean
  error: string | null
  placeholder: string
  previewLine: string
  onChange: Props['onChange']
  onSave: () => void
}) {
  const presence = rowPresence(row.draft)
  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <div>
          <p className="tx-ops__card-title">{title}</p>
          <p className="tx-ops__card-hint">{hint}</p>
        </div>
        <span className={pillClass(presence)}>{presenceCopy(presence)}</span>
      </div>
      <ShopperPreview
        line={previewLine}
        whisper={provenanceWhisperFromTier({
          status: row.draft.status,
          sourceTier: row.draft.sourceTier,
          issuerName: row.draft.issuerName,
        })}
      />
      <div className="tx-field">
        <div className="tx-label">Statement</div>
        <textarea
          className="tx-control"
          rows={3}
          disabled={!canEdit}
          placeholder={placeholder}
          value={row.draft.valueText ?? ''}
          onChange={(e) =>
            onChange(field.sub_metric_code, row.key, {
              ...row.draft,
              status: 'disclosed',
              valueText: e.target.value || null,
            })
          }
        />
      </div>
      <ProvenanceFields
        name={`rights-text-${field.sub_metric_code}`}
        anchor={row.draft}
        canEdit={canEdit}
        onPatch={(patch) =>
          onChange(field.sub_metric_code, row.key, { ...row.draft, ...patch })
        }
      />
      <div className="tx-footer" style={{ marginTop: 0 }}>
        <label className="tx-publish">
          <input
            type="checkbox"
            checked={row.draft.published}
            disabled={!canEdit || !row.draft.valueText?.trim()}
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
        {canEdit ? (
          <button
            type="button"
            className="tx-btn tx-btn--primary"
            disabled={saving || !row.draft.valueText?.trim()}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : null}
      </div>
      {error ? <p className="tx-error">{error}</p> : null}
    </div>
  )
}
