'use client'

import { useMemo } from 'react'
import type {
  DisclosureDraft,
  ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import TransparencyRoom from '@/components/transparency/TransparencyRoom'
import AidSheet from '@/components/transparency/operations/AidSheet'
import FlavorSheet from '@/components/transparency/operations/FlavorSheet'
import MadeKeptEditor from '@/components/transparency/operations/MadeKeptEditor'
import RefinementSheet from '@/components/transparency/operations/RefinementSheet'
import WholeEnumCard from '@/components/transparency/operations/WholeEnumCard'
import type {
  LabelLine,
  OpsLocalRow,
} from '@/components/transparency/operations/types'
import {
  displayAllCapsPhrase,
  splitIngredientStatement,
} from '@/app/(portal)/products/[productId]/tabs/compositionPresentation'

export type { OpsLocalRow } from '@/components/transparency/operations/types'

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

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function wholeRow(rows: OpsLocalRow[] | undefined): OpsLocalRow | undefined {
  return rows?.[0]
}

export function isOilOrFatLike(name: string): boolean {
  return /\b(oil|butter|fat|ghee|lard|tallow|shortening|margarine)\b/i.test(name)
}

export function isNaturalFlavorPhrase(name: string): boolean {
  return /\bnatural\s+flavou?rs?\b/i.test(name.trim())
}

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

      <TransparencyRoom
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
      </TransparencyRoom>

      <TransparencyRoom
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
      </TransparencyRoom>

      <TransparencyRoom
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
      </TransparencyRoom>

      <TransparencyRoom
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
      </TransparencyRoom>
    </div>
  )
}
