'use client'

import {
  composeGrievanceLine,
  composeSocialCertLine,
} from '@/lib/transparency/storyLines'
import TransparencyRoom from '@/components/transparency/TransparencyRoom'
import DiligenceEditor from './rights/DiligenceEditor'
import { disclosedText, wholeRow } from './rights/helpers'
import LaborEditor from './rights/LaborEditor'
import LivingEditor from './rights/LivingEditor'
import SingleEnumCard from './rights/SingleEnumCard'
import SingleTextCard from './rights/SingleTextCard'
import SupplierEditor from './rights/SupplierEditor'
import type { RightsSheetProps } from './rights/types'

export type { RightsLocalRow } from './rights/types'

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
}: RightsSheetProps) {
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

      <TransparencyRoom
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
      </TransparencyRoom>

      <TransparencyRoom
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
      </TransparencyRoom>

      <TransparencyRoom
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
      </TransparencyRoom>
    </div>
  )
}
