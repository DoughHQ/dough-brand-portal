'use client'

import { useMemo, useState } from 'react'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import { composePlaceLine } from '@/lib/transparency/storyLines'
import {
  displayAllCapsPhrase,
  splitIngredientStatement,
} from '@/app/(portal)/products/[productId]/tabs/compositionPresentation'
import {
  findRow,
  FINISHED_PRODUCT_SUBJECT,
  type IngredientLine,
  norm,
  ORIGIN_DEPTH_CODES,
  type OriginDepthCode,
  type OriginLocalRow,
  type Props,
  storyPresence,
} from './origin/originModel'
import { CoverageStrip } from './origin/CoverageStrip'
import { PlaceStoryEditor } from './origin/PlaceStoryEditor'

export { FINISHED_PRODUCT_SUBJECT, ORIGIN_DEPTH_CODES } from './origin/originModel'
export type { OriginDepthCode, OriginLocalRow } from './origin/originModel'

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
                  <span className={presencePillClass(presence)}>
                    {presenceLabel(presence)}
                  </span>
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
