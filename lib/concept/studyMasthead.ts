import { respondentDesignLabel } from './designLetters'
import {
  canAddCompetitor,
  canAddVariant,
  getConceptFieldSize,
  getRemainingFieldSlots,
  resolvedCompetitors,
} from './fieldSize'
import { uniquePairs } from './publish'
import type { ConceptStudyDraft } from './types'

export type MastheadFilledSeat =
  | {
      kind: 'arm'
      localId: string
      index: number
      name: string
      letter: string
      imageRef: string | null
      focusId: string
    }
  | {
      kind: 'product'
      localId: string
      name: string
      brand: string
      imageSrc: string | null
      focusId: string
    }

export type MastheadAddSeat = {
  action: 'add-design' | 'add-competitor'
  label: string
  hint: string
}

export type MastheadModel = {
  arms: MastheadFilledSeat[]
  products: MastheadFilledSeat[]
  showVs: boolean
  addDesign: MastheadAddSeat | null
  addCompetitor: MastheadAddSeat | null
  empty: boolean
  meta: string
  helper: string | null
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Quiet line under the shelf — designs, competitors, run shape. */
export function summarizeMasthead(draft: ConceptStudyDraft): string {
  const designs = draft.conceptArms.length
  const competitors = resolvedCompetitors(draft).length
  const size = getConceptFieldSize(draft)
  const n = Math.max(0, draft.targetCompletions)
  const run = `${plural(n, 'completion', 'completions')} · Runs until full`

  if (size === 0) return run

  const battles = uniquePairs(size)
  return [
    `${plural(designs, 'design', 'designs')} · ${plural(competitors, 'competitor', 'competitors')}`,
    battles > 0 ? plural(battles, 'matchup', 'matchups') : null,
    run,
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * Page-top shelf model: filled thumbs, optional vs, and add shortcuts.
 * Seats grow from the draft — never a hard-coded 4+1 cast.
 */
export function buildMastheadModel(draft: ConceptStudyDraft): MastheadModel {
  const arms: MastheadFilledSeat[] = draft.conceptArms.map((arm, index) => {
    const letter = respondentDesignLabel(index)
    const name = arm.display_name.trim()
    return {
      kind: 'arm',
      localId: arm.localId,
      index,
      name: name || letter,
      letter: letter.replace(/^Design\s+/i, '') || 'A',
      imageRef: arm.image_url ?? null,
      focusId: `field-seat-arm-${arm.localId}`,
    }
  })

  const products: MastheadFilledSeat[] = draft.products.map((product) => {
    const name = product.frozen_display_name.trim() || 'Competitor'
    const brand = product.frozen_brand_name.trim()
    return {
      kind: 'product',
      localId: product.localId,
      name,
      brand,
      imageSrc: product.frozen_image_url,
      focusId: `field-seat-product-${product.localId}`,
    }
  })

  const empty = arms.length === 0 && products.length === 0
  const remaining = getRemainingFieldSlots(draft)
  // First design seat is startSetup (incl. price studies) — not canAddVariant.
  const canDesign =
    arms.length === 0 ? remaining >= 1 : canAddVariant(draft).allowed
  const canCompetitor = canAddCompetitor(draft).allowed

  const addDesign: MastheadAddSeat | null =
    canDesign && (empty || arms.length === 0 || remaining > 0)
      ? {
          action: 'add-design',
          label: 'Add a design',
          hint: empty || arms.length === 0 ? 'Your concept' : 'Open seat',
        }
      : null

  const addCompetitor: MastheadAddSeat | null =
    canCompetitor && (empty || products.length === 0 || (remaining > 0 && !canDesign))
      ? {
          action: 'add-competitor',
          label: 'Add a competitor',
          hint: empty || products.length === 0 ? 'On the shelf' : 'Open seat',
        }
      : null

  return {
    arms,
    products,
    showVs: arms.length > 0 && products.length > 0,
    addDesign,
    addCompetitor,
    empty,
    meta: summarizeMasthead(draft),
    helper: empty ? 'Your field shows up here as you build it.' : null,
  }
}

/** Custom events on #concept-field — Field columns listen and run the real add flows. */
export const FIELD_ADD_DESIGN_EVENT = 'cb-field-add-design'
export const FIELD_ADD_COMPETITOR_EVENT = 'cb-field-add-competitor'
