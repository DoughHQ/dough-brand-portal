'use client'

import type { ReactNode } from 'react'
import {
  type DisclosureDraft,
  type DisclosureStatus,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'
import { formatProofCode, formatUnitSuffix } from '@/lib/transparency/displayMap'

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

type Props = {
  field: ProofSubMetricRow
  draft: DisclosureDraft
  canEdit: boolean
  saving: boolean
  error: string | null
  onChange: (next: DisclosureDraft) => void
  onSave: () => void
}

export default function DisclosureRowEditor({
  field,
  draft,
  canEdit,
  saving,
  error,
  onChange,
  onSave,
}: Props) {
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
