import type {
  ConceptArmRow,
  ConceptStudyDraft,
  ProductCompetitorRow,
} from '@/lib/concept/types'
import {
  evaluateFieldValidity,
  stimulusModeLabel,
} from '@/lib/concept/validity'
import {
  MAX_CONCEPT_FIELD_SIZE,
  canAddCompetitor,
  canAddVariant,
  competitorProgressLabel,
} from '@/lib/concept/fieldSize'
import { formatPriceLabel } from '@/lib/concept/price'
import { uniquePairs } from '@/lib/concept/publish'

export function updateConceptArms(
  draft: ConceptStudyDraft,
  onChange: (next: ConceptStudyDraft) => void,
  singleTestMode: boolean,
  arms: ConceptArmRow[],
) {
  if (singleTestMode) {
    // Single-test never rewrites floor prompts from arm names (label bias).
    onChange({ ...draft, conceptArms: arms })
    return
  }
  const leader = arms[0]
  const priceLabel = formatPriceLabel(leader?.frozen_price)
  const floor = draft.floor
    ? {
        ...draft.floor,
        config: {
          ...draft.floor.config,
          prompt: `Would you actually buy ${leader?.display_name.trim() || 'this'}${
            priceLabel != null ? ` at $${priceLabel}` : ''
          }?`,
        },
      }
    : draft.floor
  onChange({ ...draft, conceptArms: arms, floor })
}

export function updateConceptProducts(
  draft: ConceptStudyDraft,
  onChange: (next: ConceptStudyDraft) => void,
  products: ProductCompetitorRow[],
) {
  onChange({ ...draft, products })
}

export function deriveConceptField(draft: ConceptStudyDraft) {
  const validity = evaluateFieldValidity(draft)
  const battles = uniquePairs(draft.conceptArms.length + draft.products.length)
  const modeLabel = stimulusModeLabel(draft.stimulusMode)
  const packaging = draft.stimulusMode === 'package'
  const priceMode = draft.stimulusMode === 'price'
  const blindImageMode = packaging || priceMode

  // Every capacity/minimum decision on this screen comes from lib/concept/fieldSize.
  const addVariantAvailability = canAddVariant(draft)
  const addCompetitorAvailability = canAddCompetitor(draft)
  const competitorLabel = competitorProgressLabel(draft)

  // The one fact neither column can state on its own: the five seats are shared.
  //
  // Hidden entirely on an empty field. A capacity meter reading "0 of 5" announces
  // a constraint before anything exists to constrain — it only became reachable
  // once fresh drafts stopped seeding blank rows.
  const spots = `${validity.fieldSize} of ${MAX_CONCEPT_FIELD_SIZE} spots used`
  const reserved = validity.competitorsMissing
  const remaining = MAX_CONCEPT_FIELD_SIZE - validity.fieldSize
  // The page masthead owns the shelf polaroid; capacity stays next to the editors.
  const showCapacity = validity.fieldSize > 0
  const capacityText = !validity.fieldSizeOk
    ? `${spots} · Remove ${validity.fieldOverBy} item${validity.fieldOverBy === 1 ? '' : 's'}`
    : addVariantAvailability.allowed === false &&
        addVariantAvailability.reason === 'reserved-for-competitors'
      ? `${spots} · ${reserved} spot${reserved === 1 ? '' : 's'} reserved for ${
          reserved === 1 ? 'a required competitor' : 'required competitors'
        }`
      : validity.fieldSize >= MAX_CONCEPT_FIELD_SIZE
        ? `${spots} · field full`
        : // Say it before it bites, rather than going silent then "field full".
          remaining === 1
          ? `${spots} · 1 spot left`
          : spots

  return {
    validity,
    battles,
    modeLabel,
    priceMode,
    blindImageMode,
    addVariantAvailability,
    addCompetitorAvailability,
    competitorLabel,
    showCapacity,
    capacityText,
  }
}
