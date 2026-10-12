'use client'

import type { ConceptStudyDraft } from '@/lib/concept/types'
import {
  conceptProductRowErrors,
  type ConceptPublishFailure,
} from '@/lib/concept/validity'
import CompetitorsColumn from './CompetitorsColumn'
import OwnProductColumn from './OwnProductColumn'
import BuilderSectionChrome from './BuilderSectionChrome'
import { summarizeField } from '@/lib/concept/builderSummaries'
import { sectionHelp } from './conceptStyles'
import FieldBattleLine from './field/FieldBattleLine'
import FieldCapacityStatus from './field/FieldCapacityStatus'
import FieldLockedPanel from './field/FieldLockedPanel'
import PricePosturePicker from './field/PricePosturePicker'
import {
  deriveConceptField,
  updateConceptArms,
  updateConceptProducts,
} from './field/fieldDerived'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  error?: string | null
  publishFailure?: ConceptPublishFailure | null
  disabled?: boolean
  disabledReason?: string | null
  /** Single concept test — equal concepts and competitors; no hero rewrite. */
  singleTestMode?: boolean
}

export default function FieldSection({
  draft,
  onChange,
  error,
  publishFailure = null,
  disabled,
  disabledReason,
  singleTestMode = true,
}: Props) {
  const field = deriveConceptField(draft)

  return (
    <BuilderSectionChrome
      id="concept-field"
      title="Build the field"
      summary={summarizeField(draft)}
      done={!disabled && field.validity.fieldOk}
      className="cb-field-section"
    >
      <p style={{ ...sectionHelp, maxWidth: 720, marginBottom: 24 }}>
        Add your concepts, then choose the real products shoppers would compare them against.
      </p>
      <FieldBattleLine
        singleTestMode={singleTestMode}
        productCount={draft.conceptArms.length + draft.products.length}
        battles={field.battles}
      />

      <FieldLockedPanel disabled={disabled} disabledReason={disabledReason} />

      <div
        style={{
          opacity: disabled ? 0.45 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        <PricePosturePicker
          blindImageMode={field.blindImageMode}
          draft={draft}
          onChange={onChange}
        />

        <div className="cb-field-grid">
          <OwnProductColumn
            arms={draft.conceptArms}
            onArmsChange={(arms) => updateConceptArms(draft, onChange, singleTestMode, arms)}
            brandId={draft.brandId}
            draftId={draft.draftId}
            priceMode={field.priceMode}
            blindImageMode={field.blindImageMode}
            pricePosture={draft.pricePosture}
            modeLabel={field.modeLabel}
            addVariant={field.addVariantAvailability}
            disabled={disabled}
            singleTestMode={singleTestMode}
          />

          <CompetitorsColumn
            products={draft.products}
            onProductsChange={(products) => updateConceptProducts(draft, onChange, products)}
            priceMode={field.priceMode}
            hidePrice={field.blindImageMode}
            pricePosture={draft.pricePosture}
            addCompetitor={field.addCompetitorAvailability}
            progressLabel={field.competitorLabel}
            disabled={disabled}
            rowErrors={conceptProductRowErrors(draft.products, publishFailure)}
            singleTestMode={singleTestMode}
          />
        </div>
      </div>

      <FieldCapacityStatus
        disabled={disabled}
        showCapacity={field.showCapacity}
        fieldSizeOk={field.validity.fieldSizeOk}
        capacityText={field.capacityText}
      />

      {error ? (
        <p role="alert" style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </BuilderSectionChrome>
  )
}
