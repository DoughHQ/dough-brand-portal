'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import {
  blankDraft,
  clientValidate,
  draftFromRow,
  saveDisclosure,
  type DisclosureDraft,
  type DisclosureStatus,
  type ProofMetricRow,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'
import { formatProofCode, formatUnitSuffix } from '@/lib/transparency/displayMap'
import FormulaSheet from '@/components/transparency/FormulaSheet'
import OriginSheet, {
  FINISHED_PRODUCT_SUBJECT,
  ORIGIN_DEPTH_CODES,
} from '@/components/transparency/OriginSheet'
import OperationsSheet, {
  isNaturalFlavorPhrase,
  isOilOrFatLike,
  OPS_KEPT_CODES,
  OPS_MADE_CODES,
} from '@/components/transparency/OperationsSheet'
import PlanetSheet, {
  PLANET_PACK_CODES,
} from '@/components/transparency/PlanetSheet'
import RightsSheet, {
  RIGHTS_CERT_CODES,
  RIGHTS_DILIGENCE_CODES,
  RIGHTS_GRIEVANCE_CODES,
  RIGHTS_LABOR_CODES,
  RIGHTS_LIVING_CODES,
  RIGHTS_RISK_METRIC,
  RIGHTS_SUPPLIER_CODES,
} from '@/components/transparency/RightsSheet'
import {
  PROOF_CHAPTERS,
  chapterForMetric,
  chapterProgress,
  rowPresence,
  summarizeInventoryRow,
  type ProofChapterId,
  type RowPresence,
} from '@/lib/transparency/proofChapters'
import {
  displayAllCapsPhrase,
  splitIngredientStatement,
} from '@/app/(portal)/products/[productId]/tabs/compositionPresentation'
import './transparencyStudio.css'

type Props = {
  productId: number
  brandId: number
  canEdit: boolean
  /** Current SKU ingredient statement — seeds Formula chapter */
  ingredientStatement?: string | null
}

const STATUS_OPTIONS: { value: DisclosureStatus; label: string }[] = [
  { value: 'disclosed', label: 'Disclosed' },
  { value: 'not_disclosed', label: 'We don’t report this' },
  { value: 'not_applicable', label: 'Not applicable' },
  { value: 'unknown', label: 'Unknown' },
]

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

function isIsoCountryField(field: ProofSubMetricRow): boolean {
  return (
    field.value_kind === 'enum' &&
    Array.isArray(field.allowed_values) &&
    field.allowed_values.length === 1 &&
    field.allowed_values[0] === 'ISO_3166_1_alpha_2'
  )
}

function subjectNoun(kind: string): string {
  if (kind === 'ingredient') return 'ingredient'
  if (kind === 'component') return 'packaging component'
  if (kind === 'facility') return 'facility'
  if (kind === 'date_type') return 'date type'
  return 'subject'
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

function Label({ children }: { children: ReactNode }) {
  return <div className="tx-label">{children}</div>
}

function OptionSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="tx-control"
    >
      <option value="">{placeholder ?? 'Select…'}</option>
      {options.map((code) => (
        <option key={code} value={code}>
          {formatProofCode(code)}
        </option>
      ))}
    </select>
  )
}

function DisclosureRowEditor({
  field,
  draft,
  canEdit,
  saving,
  error,
  onChange,
  onSave,
}: {
  field: ProofSubMetricRow
  draft: DisclosureDraft
  canEdit: boolean
  saving: boolean
  error: string | null
  onChange: (next: DisclosureDraft) => void
  onSave: () => void
}) {
  const disclosed = draft.status === 'disclosed'
  const needsSubject = field.subject_kind_default !== 'whole_product'
  const showOther =
    disclosed && field.value_kind === 'enum' && draft.valueText === 'other'

  const setStatus = (raw: string) => {
    const status = raw as DisclosureStatus
    if (status !== 'disclosed') {
      onChange({
        ...draft,
        status,
        valueText: null,
        valueNum: null,
        valueBool: null,
        valueDate: null,
        valueUnit: null,
        methodCode: null,
        boundaryCode: null,
        dataQuality: null,
        otherText: null,
      })
      return
    }
    onChange({ ...draft, status })
  }

  const provClass =
    draft.sourceTier === 'third_party_verified'
      ? 'tx-prov tx-prov--verified'
      : draft.sourceTier === 'brand_document'
        ? 'tx-prov tx-prov--document'
        : 'tx-prov tx-prov--stated'

  return (
    <div className={`tx-card${draft.published ? ' tx-card--live' : ''}`}>
      <div className="tx-card__top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="tx-card__title">{field.label}</h3>
          <p className="tx-card__def">{field.definition}</p>
        </div>
      </div>

      <div className="tx-field">
        <Label>Status</Label>
        <select
          value={draft.status}
          disabled={!canEdit}
          onChange={(e) => setStatus(e.target.value)}
          className="tx-control"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {needsSubject ? (
        <div className="tx-field">
          <Label>
            {field.subject_kind_default === 'ingredient'
              ? 'Ingredient'
              : field.subject_kind_default === 'component'
                ? 'Packaging component'
                : field.subject_kind_default === 'facility'
                  ? 'Facility'
                  : 'Subject'}
          </Label>
          <input
            value={draft.subjectLabel ?? ''}
            disabled={!canEdit}
            onChange={(e) => onChange({ ...draft, subjectLabel: e.target.value })}
            placeholder={
              field.subject_kind_default === 'ingredient'
                ? 'e.g. cocoa, sugar'
                : field.subject_kind_default === 'component'
                  ? 'e.g. bottle, cap, sleeve'
                  : 'Name the subject'
            }
            className="tx-control"
          />
        </div>
      ) : null}

      {disclosed ? (
        <>
          <div className="tx-field">
            <Label>Value</Label>
            {field.value_kind === 'enum' && isIsoCountryField(field) ? (
              <input
                value={draft.valueText ?? ''}
                disabled={!canEdit}
                maxLength={2}
                placeholder="US"
                onChange={(e) =>
                  onChange({
                    ...draft,
                    valueText: e.target.value.toUpperCase().replace(/[^A-Z]/g, ''),
                  })
                }
                className="tx-control tx-control--narrow"
              />
            ) : field.value_kind === 'enum' ? (
              <OptionSelect
                value={draft.valueText ?? ''}
                disabled={!canEdit}
                options={field.allowed_values ?? []}
                onChange={(v) =>
                  onChange({
                    ...draft,
                    valueText: v || null,
                    otherText: v === 'other' ? draft.otherText : null,
                  })
                }
              />
            ) : field.value_kind === 'numeric' ? (
              <div className="tx-inline">
                <input
                  type="number"
                  step="any"
                  value={draft.valueNum ?? ''}
                  disabled={!canEdit}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      valueNum: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  className="tx-control"
                />
                {field.unit_source === 'row' ? (
                  <OptionSelect
                    value={draft.valueUnit ?? ''}
                    disabled={!canEdit}
                    options={field.allowed_units ?? []}
                    placeholder="Unit"
                    onChange={(v) => onChange({ ...draft, valueUnit: v || null })}
                  />
                ) : field.unit ? (
                  <span className="tx-unit">{formatUnitSuffix(field.unit)}</span>
                ) : null}
              </div>
            ) : field.value_kind === 'date' ? (
              <input
                type="date"
                value={draft.valueDate ?? ''}
                disabled={!canEdit}
                onChange={(e) => onChange({ ...draft, valueDate: e.target.value || null })}
                className="tx-control tx-control--date"
              />
            ) : field.value_kind === 'url' ? (
              <input
                type="url"
                value={draft.valueText ?? ''}
                disabled={!canEdit}
                placeholder="https://"
                onChange={(e) => onChange({ ...draft, valueText: e.target.value || null })}
                className="tx-control"
              />
            ) : (
              <input
                type="text"
                value={draft.valueText ?? ''}
                disabled={!canEdit}
                onChange={(e) => onChange({ ...draft, valueText: e.target.value || null })}
                className="tx-control"
              />
            )}
          </div>

          {showOther ? (
            <div className="tx-field">
              <Label>Describe “other”</Label>
              <input
                value={draft.otherText ?? ''}
                disabled={!canEdit}
                onChange={(e) => onChange({ ...draft, otherText: e.target.value || null })}
                className="tx-control"
              />
            </div>
          ) : null}

          {(field.requires_method ||
            field.requires_boundary ||
            field.requires_data_quality) && (
            <div className="tx-field">
              <div className="tx-grid">
                {field.requires_method ? (
                  <div>
                    <Label>Method</Label>
                    <OptionSelect
                      value={draft.methodCode ?? ''}
                      disabled={!canEdit}
                      options={field.allowed_methods ?? []}
                      onChange={(v) => onChange({ ...draft, methodCode: v || null })}
                    />
                  </div>
                ) : null}
                {field.requires_boundary ? (
                  <div>
                    <Label>Boundary</Label>
                    <OptionSelect
                      value={draft.boundaryCode ?? ''}
                      disabled={!canEdit}
                      options={field.allowed_boundaries ?? []}
                      onChange={(v) => onChange({ ...draft, boundaryCode: v || null })}
                    />
                  </div>
                ) : null}
                {field.requires_data_quality ? (
                  <div>
                    <Label>Data quality</Label>
                    <OptionSelect
                      value={draft.dataQuality ?? ''}
                      disabled={!canEdit}
                      options={field.allowed_data_qualities ?? []}
                      onChange={(v) => onChange({ ...draft, dataQuality: v || null })}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )}

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
        </>
      ) : (
        <div className="tx-status-note">
          <div className="tx-field" style={{ marginBottom: 10 }}>
            <Label>As of</Label>
            <input
              type="date"
              value={draft.asofDate}
              disabled={!canEdit}
              onChange={(e) => onChange({ ...draft, asofDate: e.target.value })}
              className="tx-control tx-control--date"
            />
          </div>
          Non-disclosed rows carry no value — only the status, subject, and date. That is a
          deliberate answer, not a blank.
        </div>
      )}

      <div className="tx-footer">
        <label className="tx-publish">
          <input
            type="checkbox"
            checked={draft.published}
            disabled={!canEdit}
            onChange={(e) => onChange({ ...draft, published: e.target.checked })}
          />
          <span>
            <span className="tx-publish__label">Show this to shoppers</span>
            <span className="tx-publish__hint">
              Unpublished stays private. Publishing projects to the product page and search.
            </span>
          </span>
        </label>
        {canEdit ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="tx-btn tx-btn--primary"
          >
            {saving ? 'Saving…' : draft.disclosureId != null ? 'Save changes' : 'Save'}
          </button>
        ) : null}
      </div>

      {error ? <p className="tx-error">{error}</p> : null}
    </div>
  )
}

type LocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

export default function ProductTransparencyStudio({
  productId,
  brandId,
  canEdit,
  ingredientStatement = null,
}: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [fields, setFields] = useState<ProofSubMetricRow[]>([])
  const [metrics, setMetrics] = useState<ProofMetricRow[]>([])
  const [rowsByMetric, setRowsByMetric] = useState<Record<string, LocalRow[]>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [storyError, setStoryError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [chapterId, setChapterId] = useState<ProofChapterId>('planet')
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [chapterReady, setChapterReady] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const [fieldsRes, metricsRes, rowsRes] = await Promise.all([
      supabase
        .from('proof_sub_metrics')
        .select(
          'sub_metric_code, label, definition, value_kind, allowed_values, unit_source, unit, allowed_units, requires_method, allowed_methods, requires_boundary, allowed_boundaries, requires_data_quality, allowed_data_qualities, subject_kind_default, metric_code, sort_order',
        )
        .eq('level', 'product')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('proof_metrics')
        .select('metric_code, label, definition, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('product_disclosures')
        .select('*')
        .eq('product_id', productId)
        .eq('is_current', true),
    ])

    if (fieldsRes.error || metricsRes.error || rowsRes.error) {
      setLoadError(
        fieldsRes.error?.message ??
          metricsRes.error?.message ??
          rowsRes.error?.message ??
          'Failed to load',
      )
      setLoading(false)
      return
    }

    const fieldList = (fieldsRes.data ?? []) as ProofSubMetricRow[]
    setFields(fieldList)
    setMetrics((metricsRes.data ?? []) as ProofMetricRow[])

    const byCode: Record<string, LocalRow[]> = {}
    for (const field of fieldList) {
      byCode[field.sub_metric_code] = []
    }
    for (const row of rowsRes.data ?? []) {
      const draft = draftFromRow(row)
      const list = byCode[draft.subMetricCode] ?? (byCode[draft.subMetricCode] = [])
      list.push({
        key: `saved-${row.disclosure_id}`,
        draft,
        saved: draft,
      })
    }
    for (const field of fieldList) {
      // Subject-required fields are seeded from context (e.g. Formula from the label).
      if (field.subject_kind_default !== 'whole_product') continue
      if ((byCode[field.sub_metric_code] ?? []).length === 0) {
        byCode[field.sub_metric_code] = [
          {
            key: `blank-${field.sub_metric_code}`,
            draft: blankDraft(field),
            saved: null,
          },
        ]
      }
    }
    setRowsByMetric(byCode)
    setChapterReady(false)
    setLoading(false)
  }, [productId, supabase])

  useEffect(() => {
    void load()
  }, [load])

  const fieldsByChapter = useMemo(() => {
    const map: Record<ProofChapterId, ProofSubMetricRow[]> = {
      planet: [],
      rights: [],
      origin: [],
      operations: [],
      formula: [],
    }
    for (const f of fields) {
      map[chapterForMetric(f.metric_code)].push(f)
    }
    return map
  }, [fields])

  const progressByChapter = useMemo(() => {
    const out: Record<ProofChapterId, ReturnType<typeof chapterProgress>> = {
      planet: { total: 0, started: 0, published: 0 },
      rights: { total: 0, started: 0, published: 0 },
      origin: { total: 0, started: 0, published: 0 },
      operations: { total: 0, started: 0, published: 0 },
      formula: { total: 0, started: 0, published: 0 },
    }
    for (const ch of PROOF_CHAPTERS) {
      if (ch.id === 'formula') {
        // Ingredient-first: count label lines (+ custom subjects), not abstract fields.
        const fromLabel = ingredientStatement?.trim()
          ? splitIngredientStatement(ingredientStatement).map((p) =>
              displayAllCapsPhrase(p).trim().toLowerCase().replace(/\s+/g, ' '),
            )
          : []
        const subjects = new Set(fromLabel.filter(Boolean))
        for (const code of ['ingredient_percentage', 'sub_ingredient_breakout'] as const) {
          for (const row of rowsByMetric[code] ?? []) {
            const s = (row.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
            if (s) subjects.add(s)
          }
        }
        let started = 0
        let published = 0
        for (const s of subjects) {
          const pct = (rowsByMetric['ingredient_percentage'] ?? []).find(
            (r) =>
              (r.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ') === s,
          )
          const brk = (rowsByMetric['sub_ingredient_breakout'] ?? []).find(
            (r) =>
              (r.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ') === s,
          )
          const anyStarted =
            (pct && rowPresence(pct.draft) !== 'not_started') ||
            (brk && rowPresence(brk.draft) !== 'not_started')
          const anyPublished =
            (pct && rowPresence(pct.draft) === 'published') ||
            (brk && rowPresence(brk.draft) === 'published')
          if (anyStarted) started += 1
          if (anyPublished) published += 1
        }
        out.formula = {
          total: Math.max(subjects.size, 0),
          started,
          published,
        }
        continue
      }
      if (ch.id === 'origin') {
        const fromLabel = ingredientStatement?.trim()
          ? splitIngredientStatement(ingredientStatement).map((p) =>
              displayAllCapsPhrase(p).trim().toLowerCase().replace(/\s+/g, ' '),
            )
          : []
        const subjects = new Set<string>([
          FINISHED_PRODUCT_SUBJECT.trim().toLowerCase(),
          ...fromLabel.filter(Boolean),
        ])
        for (const code of ORIGIN_DEPTH_CODES) {
          for (const row of rowsByMetric[code] ?? []) {
            const s = (row.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
            if (s) subjects.add(s)
          }
        }
        let started = 0
        let published = 0
        for (const s of subjects) {
          let anyStarted = false
          let anyPublished = false
          for (const code of ORIGIN_DEPTH_CODES) {
            const row = (rowsByMetric[code] ?? []).find(
              (r) =>
                (r.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ') === s,
            )
            if (!row) continue
            const p = rowPresence(row.draft)
            if (p !== 'not_started') anyStarted = true
            if (p === 'published') anyPublished = true
          }
          if (anyStarted) started += 1
          if (anyPublished) published += 1
        }
        const journeyFields = fieldsByChapter.origin.filter((f) => f.metric_code !== 'origin')
        const journey = chapterProgress(journeyFields, rowsByMetric)
        const coverageRows = rowsByMetric['origin_coverage_pct'] ?? []
        const coverageStarted = coverageRows.some((r) => rowPresence(r.draft) !== 'not_started')
          ? 1
          : 0
        const coveragePublished = coverageRows.some((r) => rowPresence(r.draft) === 'published')
          ? 1
          : 0
        const coverageTotal = fieldsByChapter.origin.some(
          (f) => f.sub_metric_code === 'origin_coverage_pct',
        )
          ? 1
          : 0
        out.origin = {
          total: subjects.size + journey.total + coverageTotal,
          started: started + journey.started + coverageStarted,
          published: published + journey.published + coveragePublished,
        }
        continue
      }
      if (ch.id === 'operations') {
        const fromLabel = ingredientStatement?.trim()
          ? splitIngredientStatement(ingredientStatement).map((p) => displayAllCapsPhrase(p))
          : []
        const oilSubjects = new Set<string>()
        const flavorSubjects = new Set<string>()
        for (const name of fromLabel) {
          if (isOilOrFatLike(name)) oilSubjects.add(name.trim().toLowerCase().replace(/\s+/g, ' '))
          if (isNaturalFlavorPhrase(name))
            flavorSubjects.add(name.trim().toLowerCase().replace(/\s+/g, ' '))
        }
        for (const row of rowsByMetric['refinement_state'] ?? []) {
          const s = (row.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
          if (s) oilSubjects.add(s)
        }
        for (const row of rowsByMetric['natural_flavor_composition'] ?? []) {
          const s = (row.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
          if (s) flavorSubjects.add(s)
        }
        const aidSubjects = (rowsByMetric['processing_aid_disclosed'] ?? []).filter((r) =>
          (r.draft.subjectLabel ?? '').trim(),
        )

        const slot = (codes: readonly string[]) => {
          let started = false
          let published = false
          for (const code of codes) {
            for (const row of rowsByMetric[code] ?? []) {
              const p = rowPresence(row.draft)
              if (p !== 'not_started') started = true
              if (p === 'published') published = true
            }
          }
          return { started, published }
        }

        const made = slot(OPS_MADE_CODES)
        const kept = slot(OPS_KEPT_CODES)
        const pasteur = slot(['pasteurization_method'])
        const additional = slot(['additional_treatment'])

        let oilStarted = 0
        let oilPublished = 0
        for (const s of oilSubjects) {
          const row = (rowsByMetric['refinement_state'] ?? []).find(
            (r) =>
              (r.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ') === s,
          )
          if (row && rowPresence(row.draft) !== 'not_started') oilStarted += 1
          if (row && rowPresence(row.draft) === 'published') oilPublished += 1
        }
        let flavorStarted = 0
        let flavorPublished = 0
        for (const s of flavorSubjects) {
          const row = (rowsByMetric['natural_flavor_composition'] ?? []).find(
            (r) =>
              (r.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ') === s,
          )
          if (row && rowPresence(row.draft) !== 'not_started') flavorStarted += 1
          if (row && rowPresence(row.draft) === 'published') flavorPublished += 1
        }
        const aidStarted = aidSubjects.filter((r) => rowPresence(r.draft) !== 'not_started').length
        const aidPublished = aidSubjects.filter((r) => rowPresence(r.draft) === 'published').length

        const has = (code: string) => fieldsByChapter.operations.some((f) => f.sub_metric_code === code)
        const madeTotal = has('process_method') || has('process_parameter') ? 1 : 0
        const keptTotal =
          has('storage_condition') || has('shelf_life_basis') || has('handling_note') ? 1 : 0
        const pasteurTotal = has('pasteurization_method') ? 1 : 0
        const additionalTotal = has('additional_treatment') ? 1 : 0
        const oilTotal = has('refinement_state') ? Math.max(oilSubjects.size, 0) : 0
        const flavorTotal = has('natural_flavor_composition')
          ? Math.max(flavorSubjects.size, 0)
          : 0
        const aidTotal = has('processing_aid_disclosed') ? Math.max(aidSubjects.length, 0) : 0

        out.operations = {
          total:
            madeTotal +
            keptTotal +
            pasteurTotal +
            additionalTotal +
            oilTotal +
            flavorTotal +
            aidTotal,
          started:
            (made.started ? madeTotal : 0) +
            (kept.started ? keptTotal : 0) +
            (pasteur.started ? pasteurTotal : 0) +
            (additional.started ? additionalTotal : 0) +
            oilStarted +
            flavorStarted +
            aidStarted,
          published:
            (made.published ? madeTotal : 0) +
            (kept.published ? keptTotal : 0) +
            (pasteur.published ? pasteurTotal : 0) +
            (additional.published ? additionalTotal : 0) +
            oilPublished +
            flavorPublished +
            aidPublished,
        }
        continue
      }
      if (ch.id === 'planet') {
        const slot = (codes: readonly string[]) => {
          let started = false
          let published = false
          for (const code of codes) {
            for (const row of rowsByMetric[code] ?? []) {
              const p = rowPresence(row.draft)
              if (p !== 'not_started') started = true
              if (p === 'published') published = true
            }
          }
          return { started, published }
        }
        const pcf = slot(['product_carbon_footprint'])
        const packSubjects = new Set<string>()
        for (const code of PLANET_PACK_CODES) {
          for (const row of rowsByMetric[code] ?? []) {
            const s = (row.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
            if (s) packSubjects.add(s)
          }
        }
        let packStarted = 0
        let packPublished = 0
        for (const s of packSubjects) {
          let anyStarted = false
          let anyPublished = false
          for (const code of PLANET_PACK_CODES) {
            const row = (rowsByMetric[code] ?? []).find(
              (r) =>
                (r.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ') === s,
            )
            if (!row) continue
            const p = rowPresence(row.draft)
            if (p !== 'not_started') anyStarted = true
            if (p === 'published') anyPublished = true
          }
          if (anyStarted) packStarted += 1
          if (anyPublished) packPublished += 1
        }
        const restFields = fieldsByChapter.planet.filter(
          (f) =>
            f.metric_code === 'land_and_soil' || f.metric_code === 'corporate_footprint',
        )
        const rest = chapterProgress(restFields, rowsByMetric)
        const pcfTotal = fieldsByChapter.planet.some(
          (f) => f.sub_metric_code === 'product_carbon_footprint',
        )
          ? 1
          : 0
        out.planet = {
          total: pcfTotal + packSubjects.size + rest.total,
          started: (pcf.started ? pcfTotal : 0) + packStarted + rest.started,
          published: (pcf.published ? pcfTotal : 0) + packPublished + rest.published,
        }
        continue
      }
      if (ch.id === 'rights') {
        const slot = (codes: readonly string[]) => {
          let started = false
          let published = false
          let present = false
          for (const code of codes) {
            if (fieldsByChapter.rights.some((f) => f.sub_metric_code === code)) {
              present = true
            }
            for (const row of rowsByMetric[code] ?? []) {
              const p = rowPresence(row.draft)
              if (p !== 'not_started') started = true
              if (p === 'published') published = true
            }
          }
          return { present, started, published }
        }
        const living = slot(RIGHTS_LIVING_CODES)
        const labor = slot(RIGHTS_LABOR_CODES)
        const cert = slot(RIGHTS_CERT_CODES)
        const diligence = slot(RIGHTS_DILIGENCE_CODES)
        const grievance = slot(RIGHTS_GRIEVANCE_CODES)
        const supplier = slot(RIGHTS_SUPPLIER_CODES)
        const slots = [living, labor, cert, diligence, grievance, supplier]
        const riskFields = fieldsByChapter.rights.filter(
          (f) => f.metric_code === RIGHTS_RISK_METRIC,
        )
        const risk = chapterProgress(riskFields, rowsByMetric)
        out.rights = {
          total: slots.filter((s) => s.present).length + risk.total,
          started:
            slots.filter((s) => s.present && s.started).length + risk.started,
          published:
            slots.filter((s) => s.present && s.published).length + risk.published,
        }
        continue
      }
    }
    return out
  }, [fieldsByChapter, rowsByMetric, ingredientStatement])

  // Open the chapter with the most unfinished work once per load.
  useEffect(() => {
    if (loading || chapterReady || fields.length === 0) return
    let best: ProofChapterId = 'planet'
    let bestScore = -1
    for (const ch of PROOF_CHAPTERS) {
      const p = progressByChapter[ch.id]
      if (p.total === 0) continue
      const unfinished = p.total - p.published
      if (unfinished > bestScore) {
        bestScore = unfinished
        best = ch.id
      }
    }
    setChapterId(best)
    setChapterReady(true)
  }, [loading, chapterReady, fields.length, progressByChapter])

  const totals = useMemo(() => {
    let published = 0
    let privateN = 0
    let untouched = 0
    for (const ch of PROOF_CHAPTERS) {
      const p = progressByChapter[ch.id]
      published += p.published
      privateN += Math.max(0, p.started - p.published)
      untouched += Math.max(0, p.total - p.started)
    }
    return { published, privateN, untouched }
  }, [progressByChapter])

  const activeChapter = PROOF_CHAPTERS.find((c) => c.id === chapterId) ?? PROOF_CHAPTERS[0]!
  const chapterFields = fieldsByChapter[activeChapter.id]

  const metricLabel = useMemo(() => {
    const m = new Map(metrics.map((x) => [x.metric_code, x.label]))
    return (code: string) => m.get(code) ?? code
  }, [metrics])

  const groupsInChapter = useMemo(() => {
    const order: string[] = []
    const map = new Map<string, ProofSubMetricRow[]>()
    for (const f of chapterFields) {
      if (!map.has(f.metric_code)) {
        map.set(f.metric_code, [])
        order.push(f.metric_code)
      }
      map.get(f.metric_code)!.push(f)
    }
    return order.map((code) => ({
      metricCode: code,
      label: metricLabel(code),
      fields: map.get(code)!,
    }))
  }, [chapterFields, metricLabel])

  const updateRow = (subMetricCode: string, key: string, draft: DisclosureDraft) => {
    setRowsByMetric((prev) => {
      const list = prev[subMetricCode] ?? []
      const idx = list.findIndex((r) => r.key === key)
      if (idx >= 0) {
        return {
          ...prev,
          [subMetricCode]: list.map((r) => (r.key === key ? { ...r, draft } : r)),
        }
      }
      return {
        ...prev,
        [subMetricCode]: [...list, { key, draft, saved: null }],
      }
    })
    setErrors((e) => {
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  const ensureSubjectRow = (field: ProofSubMetricRow, subjectLabel: string): string => {
    const n = subjectLabel.trim().toLowerCase().replace(/\s+/g, ' ')
    const existing = (rowsByMetric[field.sub_metric_code] ?? []).find(
      (r) => (r.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ') === n,
    )
    if (existing) return existing.key
    const key = `draft-${field.sub_metric_code}-${n.replace(/[^a-z0-9]+/g, '-')}`
    const draft = blankDraft(field, {
      subjectKind: field.subject_kind_default,
      subjectLabel: subjectLabel.trim(),
      status: 'disclosed',
    })
    setRowsByMetric((prev) => ({
      ...prev,
      [field.sub_metric_code]: [...(prev[field.sub_metric_code] ?? []), { key, draft, saved: null }],
    }))
    return key
  }

  const addCustomIngredient = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const pct = fields.find((f) => f.sub_metric_code === 'ingredient_percentage')
    if (pct) ensureSubjectRow(pct, trimmed)
    const country = fields.find((f) => f.sub_metric_code === 'origin_country')
    if (country) ensureSubjectRow(country, trimmed)
  }

  const addSubjectRow = (field: ProofSubMetricRow) => {
    const key = `new-${field.sub_metric_code}-${Date.now()}`
    setRowsByMetric((prev) => ({
      ...prev,
      [field.sub_metric_code]: [
        ...(prev[field.sub_metric_code] ?? []),
        { key, draft: blankDraft(field), saved: null },
      ],
    }))
    setOpenKey(key)
  }

  const handleSave = async (field: ProofSubMetricRow, row: LocalRow) => {
    const err = clientValidate(field, row.draft)
    if (err) {
      setErrors((e) => ({ ...e, [row.key]: err }))
      return
    }
    setSavingKey(row.key)
    const result = await saveDisclosure({
      supabase,
      productId,
      brandId,
      field,
      draft: row.draft,
      prior: row.saved,
    })
    setSavingKey(null)
    if (!result.ok) {
      setErrors((e) => ({ ...e, [row.key]: result.error }))
      if (process.env.NODE_ENV === 'development') {
        console.error('[transparency] save failed', result.error)
      }
      return
    }
    const nextDraft: DisclosureDraft = {
      ...row.draft,
      disclosureId: result.disclosureId,
    }
    const nextKey = `saved-${result.disclosureId}`
    setRowsByMetric((prev) => ({
      ...prev,
      [field.sub_metric_code]: (prev[field.sub_metric_code] ?? []).map((r) =>
        r.key === row.key
          ? { key: nextKey, draft: nextDraft, saved: nextDraft }
          : r,
      ),
    }))
    setOpenKey(nextKey)
  }

  const handleSaveOriginStory = async (subject: string) => {
    setStoryError(null)
    const subjectNorm = subject.trim().toLowerCase().replace(/\s+/g, ' ')
    setSavingKey(subjectNorm)

    const findRow = (code: string) =>
      (rowsByMetric[code] ?? []).find(
        (r) =>
          (r.draft.subjectLabel ?? '').trim().toLowerCase().replace(/\s+/g, ' ') ===
          subjectNorm,
      )

    const anchor =
      findRow('origin_country')?.draft ??
      findRow('origin_region')?.draft ??
      findRow('origin_producer_name')?.draft ??
      findRow('origin_geolocation')?.draft ??
      null

    if (!anchor) {
      setStoryError('Add a country, region, or producer before saving.')
      setSavingKey(null)
      return
    }

    const shared = {
      sourceTier: anchor.sourceTier,
      sourceUrl: anchor.sourceUrl,
      issuerName: anchor.issuerName,
      credentialId: anchor.credentialId,
      asofDate: anchor.asofDate,
      published: anchor.published,
      subjectKind: 'ingredient' as const,
      subjectLabel: subject.trim(),
      status: 'disclosed' as const,
    }

    const queue: { field: ProofSubMetricRow; row: LocalRow; draft: DisclosureDraft }[] = []
    for (const code of ORIGIN_DEPTH_CODES) {
      const field = fields.find((f) => f.sub_metric_code === code)
      if (!field) continue
      const row = findRow(code)
      if (!row) continue
      const draft: DisclosureDraft = { ...row.draft, ...shared }
      const hasValue = Boolean(draft.valueText?.trim())
      if (!hasValue) continue
      queue.push({ field, row, draft })
    }

    if (queue.length === 0) {
      setStoryError('Add at least a country before saving.')
      setSavingKey(null)
      return
    }

    for (const item of queue) {
      const err = clientValidate(item.field, item.draft)
      if (err) {
        setStoryError(err)
        setSavingKey(null)
        return
      }
    }

    const applied: { code: string; oldKey: string; nextKey: string; draft: DisclosureDraft }[] =
      []
    for (const item of queue) {
      const result = await saveDisclosure({
        supabase,
        productId,
        brandId,
        field: item.field,
        draft: item.draft,
        prior: item.row.saved,
      })
      if (!result.ok) {
        setStoryError(result.error)
        break
      }
      applied.push({
        code: item.field.sub_metric_code,
        oldKey: item.row.key,
        nextKey: `saved-${result.disclosureId}`,
        draft: { ...item.draft, disclosureId: result.disclosureId },
      })
    }

    if (applied.length > 0) {
      setRowsByMetric((prev) => {
        const next = { ...prev }
        for (const u of applied) {
          next[u.code] = (next[u.code] ?? []).map((r) =>
            r.key === u.oldKey ? { key: u.nextKey, draft: u.draft, saved: u.draft } : r,
          )
        }
        return next
      })
    }
    setSavingKey(null)
  }

  const handleSaveOpsBundle = async (codes: readonly string[], bundleKey: string) => {
    setStoryError(null)
    setSavingKey(bundleKey)

    const items: { field: ProofSubMetricRow; row: LocalRow; draft: DisclosureDraft }[] = []
    let anchor: DisclosureDraft | null = null
    for (const code of codes) {
      const field = fields.find((f) => f.sub_metric_code === code)
      const row = (rowsByMetric[code] ?? [])[0]
      if (!field || !row) continue
      if (!anchor) anchor = row.draft
      const hasValue = Boolean(row.draft.valueText?.trim()) || row.draft.valueNum != null
      if (!hasValue) continue
      items.push({ field, row, draft: row.draft })
    }

    if (items.length === 0 || !anchor) {
      setStoryError('Add at least one value before saving.')
      setSavingKey(null)
      return
    }

    const shared = {
      sourceTier: anchor.sourceTier,
      sourceUrl: anchor.sourceUrl,
      issuerName: anchor.issuerName,
      credentialId: anchor.credentialId,
      asofDate: anchor.asofDate,
      published: anchor.published,
      status: 'disclosed' as const,
    }

    const queue = items.map((item) => ({
      ...item,
      draft: { ...item.draft, ...shared },
    }))

    for (const item of queue) {
      const err = clientValidate(item.field, item.draft)
      if (err) {
        setStoryError(err)
        setSavingKey(null)
        return
      }
    }

    const applied: { code: string; oldKey: string; nextKey: string; draft: DisclosureDraft }[] =
      []
    for (const item of queue) {
      const result = await saveDisclosure({
        supabase,
        productId,
        brandId,
        field: item.field,
        draft: item.draft,
        prior: item.row.saved,
      })
      if (!result.ok) {
        setStoryError(result.error)
        break
      }
      applied.push({
        code: item.field.sub_metric_code,
        oldKey: item.row.key,
        nextKey: `saved-${result.disclosureId}`,
        draft: { ...item.draft, disclosureId: result.disclosureId },
      })
    }

    if (applied.length > 0) {
      setRowsByMetric((prev) => {
        const next = { ...prev }
        for (const u of applied) {
          next[u.code] = (next[u.code] ?? []).map((r) =>
            r.key === u.oldKey ? { key: u.nextKey, draft: u.draft, saved: u.draft } : r,
          )
        }
        return next
      })
    }
    setSavingKey(null)
  }

  const originFieldsByCode = useMemo(() => {
    const map: Record<string, ProofSubMetricRow | undefined> = {}
    for (const f of fieldsByChapter.origin) {
      if (f.metric_code === 'origin') map[f.sub_metric_code] = f
    }
    return map
  }, [fieldsByChapter.origin])

  const operationsFieldsByCode = useMemo(() => {
    const map: Record<string, ProofSubMetricRow | undefined> = {}
    for (const f of fieldsByChapter.operations) {
      map[f.sub_metric_code] = f
    }
    return map
  }, [fieldsByChapter.operations])

  const planetFieldsByCode = useMemo(() => {
    const map: Record<string, ProofSubMetricRow | undefined> = {}
    for (const f of fieldsByChapter.planet) {
      map[f.sub_metric_code] = f
    }
    return map
  }, [fieldsByChapter.planet])

  const rightsFieldsByCode = useMemo(() => {
    const map: Record<string, ProofSubMetricRow | undefined> = {}
    for (const f of fieldsByChapter.rights) {
      map[f.sub_metric_code] = f
    }
    return map
  }, [fieldsByChapter.rights])

  const journeyGroups = useMemo(
    () => groupsInChapter.filter((g) => g.metricCode !== 'origin'),
    [groupsInChapter],
  )

  const planetRestGroups = useMemo(
    () =>
      groupsInChapter.filter(
        (g) => g.metricCode === 'land_and_soil' || g.metricCode === 'corporate_footprint',
      ),
    [groupsInChapter],
  )

  const rightsRestGroups = useMemo(
    () => groupsInChapter.filter((g) => g.metricCode === RIGHTS_RISK_METRIC),
    [groupsInChapter],
  )

  const depthSummary = (chId: ProofChapterId): string => {
    const p = progressByChapter[chId]
    if (chId === 'origin') {
      const verified = ORIGIN_DEPTH_CODES.reduce((n, code) => {
        return (
          n +
          (rowsByMetric[code] ?? []).filter(
            (r) =>
              rowPresence(r.draft) !== 'not_started' &&
              r.draft.sourceTier === 'third_party_verified',
          ).length
        )
      }, 0)
      const places = p.started
      if (places === 0) return 'No places yet'
      return verified > 0 ? `${places} places · ${verified} verified` : `${places} places`
    }
    if (chId === 'planet') {
      const pcfOn = (rowsByMetric['product_carbon_footprint'] ?? []).some(
        (r) => rowPresence(r.draft) !== 'not_started',
      )
      const packN = new Set(
        PLANET_PACK_CODES.flatMap((code) =>
          (rowsByMetric[code] ?? [])
            .map((r) => (r.draft.subjectLabel ?? '').trim().toLowerCase())
            .filter(Boolean),
        ),
      ).size
      const bits = [
        pcfOn ? 'PCF' : null,
        packN > 0 ? `${packN} pack` : null,
      ].filter(Boolean)
      return bits.length ? bits.join(' · ') : 'Not started'
    }
    if (chId === 'formula') {
      return p.started > 0 ? `${p.started} ingredients` : 'Not started'
    }
    if (chId === 'operations') {
      return p.started > 0 ? `${p.published}/${p.total} live` : 'Not started'
    }
    if (chId === 'rights') {
      return p.started > 0 ? `${p.published}/${p.total} live` : 'Not started'
    }
    return p.started > 0 ? `${p.published}/${p.total} published` : 'Not started'
  }

  const renderInventoryGroups = (
    groups: typeof groupsInChapter,
    opts?: { forceGroupLabel?: boolean },
  ) =>
    groups.map((group) => (
      <div key={group.metricCode} className="tx-group">
        {opts?.forceGroupLabel || groupsInChapter.length > 1 ? (
          <p className="tx-group__label">{group.label}</p>
        ) : null}
        <div className="tx-inventory">
          {group.fields.flatMap((field) => {
            const rows = rowsByMetric[field.sub_metric_code] ?? []
            return rows.map((row) => {
              const summary = summarizeInventoryRow(field, row.draft)
              const open = openKey === row.key
              return (
                <div key={row.key} className={`tx-row${open ? ' tx-row--open' : ''}`}>
                  <button
                    type="button"
                    className="tx-row__hit"
                    onClick={() => setOpenKey(open ? null : row.key)}
                    aria-expanded={open}
                  >
                    <span className="tx-row__main">
                      <p className="tx-row__title">{summary.title}</p>
                      {summary.detail ? (
                        <p className="tx-row__detail">{summary.detail}</p>
                      ) : summary.presence === 'not_started' ? (
                        <p className="tx-row__detail">Tap to disclose</p>
                      ) : null}
                    </span>
                    <span className="tx-row__meta">
                      <span className={pillClass(summary.presence)}>
                        {summary.presenceLabel}
                      </span>
                      {summary.whisper || summary.asOf ? (
                        <span className="tx-row__whisper">
                          {[summary.whisper, summary.asOf ? `as of ${summary.asOf}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      ) : null}
                      <span className="tx-row__chev" aria-hidden>
                        ›
                      </span>
                    </span>
                  </button>
                  {open ? (
                    <div className="tx-row__editor">
                      <DisclosureRowEditor
                        field={field}
                        draft={row.draft}
                        canEdit={canEdit}
                        saving={savingKey === row.key}
                        error={errors[row.key] ?? null}
                        onChange={(d) => updateRow(field.sub_metric_code, row.key, d)}
                        onSave={() => void handleSave(field, row)}
                      />
                    </div>
                  ) : null}
                </div>
              )
            })
          })}
        </div>
        {canEdit &&
        group.fields.some((f) => f.subject_kind_default !== 'whole_product')
          ? group.fields
              .filter((f) => f.subject_kind_default !== 'whole_product')
              .map((field) => (
                <button
                  key={`add-${field.sub_metric_code}`}
                  type="button"
                  className="tx-add"
                  onClick={() => addSubjectRow(field)}
                >
                  Add another {subjectNoun(field.subject_kind_default)}
                  {group.fields.length > 1 ? ` · ${field.label}` : ''}
                </button>
              ))
          : null}
      </div>
    ))

  if (loading) {
    return <div className="tx-loading">Loading transparency registry…</div>
  }

  if (loadError) {
    return (
      <div className="tx-empty">
        <p className="tx-studio__title" style={{ fontSize: 22, marginBottom: 8 }}>
          Transparency
        </p>
        <p style={{ margin: 0 }}>{loadError}</p>
      </div>
    )
  }

  return (
    <div className="tx-studio">
      <header className="tx-studio__header">
        <p className="tx-studio__eyebrow">P.R.O.O.F. · Product transparency</p>
        <div className="tx-studio__title-row">
          <h2 className="tx-studio__title">Disclosures</h2>
          <div className="tx-studio__stats">
            <span>
              <strong>{totals.published}</strong> published
            </span>
            <span>
              <strong>{totals.privateN}</strong> private
            </span>
            <span>
              <strong>{totals.untouched}</strong> not started
            </span>
          </div>
        </div>
        <p className="tx-studio__lede">
          Five chapters. Disclose what you know, with provenance. Unpublished stays private —
          publishing is what shoppers see.
        </p>
      </header>

      <div className="tx-shell">
        <nav className="tx-rail" aria-label="P.R.O.O.F. chapters">
          {PROOF_CHAPTERS.map((ch) => {
            const p = progressByChapter[ch.id]
            const pct = p.total === 0 ? 0 : Math.round((p.published / p.total) * 100)
            const active = ch.id === activeChapter.id
            return (
              <button
                key={ch.id}
                type="button"
                className={`tx-rail__btn${active ? ' tx-rail__btn--active' : ''}`}
                onClick={() => {
                  setChapterId(ch.id)
                  setOpenKey(null)
                }}
                aria-current={active ? 'page' : undefined}
              >
                <span className="tx-rail__letter" aria-hidden>
                  {ch.letter}
                </span>
                <span className="tx-rail__meta">
                  <span className="tx-rail__name">{ch.name}</span>
                  <span className="tx-rail__progress">{depthSummary(ch.id)}</span>
                  <span className="tx-rail__bar" aria-hidden>
                    <span style={{ width: `${pct}%` }} />
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="tx-pane">
          <div className="tx-pane__head">
            <p className="tx-pane__kicker">
              {activeChapter.letter} · {activeChapter.name}
            </p>
            <h3 className="tx-pane__title">{activeChapter.name}</h3>
            <p className="tx-pane__lede">{activeChapter.lede}</p>
          </div>

          {chapterFields.length === 0 ? (
            <div className="tx-empty">No product fields in this chapter yet.</div>
          ) : activeChapter.id === 'formula' ? (
            <FormulaSheet
              ingredientStatement={ingredientStatement}
              pctField={
                chapterFields.find((f) => f.sub_metric_code === 'ingredient_percentage') ??
                null
              }
              breakoutField={
                chapterFields.find((f) => f.sub_metric_code === 'sub_ingredient_breakout') ??
                null
              }
              pctRows={rowsByMetric['ingredient_percentage'] ?? []}
              breakoutRows={rowsByMetric['sub_ingredient_breakout'] ?? []}
              canEdit={canEdit}
              savingKey={savingKey}
              errors={errors}
              onChange={updateRow}
              onSave={(field, row) => void handleSave(field, row)}
              onEnsureRow={ensureSubjectRow}
              onAddCustomIngredient={addCustomIngredient}
            />
          ) : activeChapter.id === 'origin' ? (
            <>
              <OriginSheet
                ingredientStatement={ingredientStatement}
                fieldsByCode={originFieldsByCode}
                rowsByCode={rowsByMetric}
                canEdit={canEdit}
                savingSubject={savingKey}
                storyError={storyError}
                onChange={updateRow}
                onEnsureRow={ensureSubjectRow}
                onAddCustomIngredient={addCustomIngredient}
                onSaveStory={(subject) => void handleSaveOriginStory(subject)}
                onSaveCoverage={(row) => {
                  const field = originFieldsByCode['origin_coverage_pct']
                  if (field) void handleSave(field, row)
                }}
                onClearStoryError={() => setStoryError(null)}
              />
              {journeyGroups.length > 0 ? (
                <div className="tx-origin__journey">
                  <div className="tx-origin__journey-head">
                    <p className="tx-group__label">Journey</p>
                    <p className="tx-origin__journey-lede">
                      Facilities, key dates, and lot codes — separate from ingredient place
                      stories.
                    </p>
                  </div>
                  {renderInventoryGroups(journeyGroups, { forceGroupLabel: true })}
                </div>
              ) : null}
            </>
          ) : activeChapter.id === 'operations' ? (
            <OperationsSheet
              ingredientStatement={ingredientStatement}
              fieldsByCode={operationsFieldsByCode}
              rowsByCode={rowsByMetric}
              canEdit={canEdit}
              savingKey={savingKey}
              storyError={storyError}
              errors={errors}
              onChange={updateRow}
              onEnsureRow={ensureSubjectRow}
              onSaveRow={(field, row) => void handleSave(field, row)}
              onSaveBundle={(codes, key) => void handleSaveOpsBundle(codes, key)}
              onClearStoryError={() => setStoryError(null)}
            />
          ) : activeChapter.id === 'planet' ? (
            <>
              <PlanetSheet
                fieldsByCode={planetFieldsByCode}
                rowsByCode={rowsByMetric}
                canEdit={canEdit}
                savingKey={savingKey}
                storyError={storyError}
                errors={errors}
                onChange={updateRow}
                onEnsureRow={ensureSubjectRow}
                onSaveRow={(field, row) => void handleSave(field, row)}
                onSaveBundle={(codes, key) => void handleSaveOpsBundle(codes, key)}
                onClearStoryError={() => setStoryError(null)}
                onSeedPackComponents={(names) => {
                  const material = fields.find(
                    (f) => f.sub_metric_code === 'packaging_primary_material',
                  )
                  if (!material) return
                  for (const name of names) ensureSubjectRow(material, name)
                }}
              />
              {planetRestGroups.length > 0 ? (
                <div className="tx-origin__journey">
                  <div className="tx-origin__journey-head">
                    <p className="tx-group__label">Land & corporate</p>
                    <p className="tx-origin__journey-lede">
                      Practices and corporate footprint — still available as inventory.
                    </p>
                  </div>
                  {renderInventoryGroups(planetRestGroups, { forceGroupLabel: true })}
                </div>
              ) : null}
            </>
          ) : activeChapter.id === 'rights' ? (
            <>
              <RightsSheet
                fieldsByCode={rightsFieldsByCode}
                rowsByCode={rowsByMetric}
                canEdit={canEdit}
                savingKey={savingKey}
                storyError={storyError}
                errors={errors}
                onChange={updateRow}
                onSaveRow={(field, row) => void handleSave(field, row)}
                onSaveBundle={(codes, key) => void handleSaveOpsBundle(codes, key)}
                onClearStoryError={() => setStoryError(null)}
              />
              {rightsRestGroups.length > 0 ? (
                <div className="tx-origin__journey">
                  <div className="tx-origin__journey-head">
                    <p className="tx-group__label">High-risk inputs</p>
                    <p className="tx-origin__journey-lede">
                      Named ingredients — certifications, deforestation cut-offs, and chain of
                      custody. Add each input you want to disclose.
                    </p>
                  </div>
                  {renderInventoryGroups(rightsRestGroups, { forceGroupLabel: true })}
                </div>
              ) : null}
            </>
          ) : (
            renderInventoryGroups(groupsInChapter)
          )}
        </div>
      </div>
    </div>
  )
}
