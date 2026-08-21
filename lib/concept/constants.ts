import type { BattleIntent, PricePosture, StimulusMode } from './types'

/** Admin test brand — Dough HQ sandbox. */
export const CONCEPT_DEFAULT_BRAND_ID = 20016372

export const PACKAGING_TEMPLATE_CODE = 'S1_CONCEPT_PACKAGING'
export const PRICE_TEMPLATE_CODE = 'S1_CONCEPT_PRICE'

export const NONE_OF_THESE = 'None of these'

/** Bumped for the ID-shaped option contract (objects, not strings). Old drafts are abandoned. */
export const DRAFT_STORAGE_KEY = 'dough.conceptDrafts.v4'
/** Prior key — not migrated into v4 (hard reset). */
export const DRAFT_STORAGE_KEY_LEGACY = 'dough.conceptDrafts.v3'

/** Stable sentinel ids — must match server + runner + report. */
export const DECOY_ID = 'decoy' as const
export const NONE_OF_THESE_ID = 'none_of_these' as const
export const NOT_SURE_ID = 'not_sure' as const

export const STIMULUS_MODE_OPTIONS: {
  value: StimulusMode
  label: string
  help: string
  publishable: boolean
}[] = [
  {
    value: 'package',
    label: 'Packaging',
    help: 'Same product, different designs. Tells you which design to print.',
    publishable: true,
  },
  {
    value: 'name',
    label: 'Name',
    help: 'Same product, different names. Everything else held constant.',
    publishable: false,
  },
  {
    value: 'flavor',
    label: 'Flavor',
    help: 'Which variety to launch.',
    publishable: false,
  },
  {
    value: 'claim',
    label: 'Claim',
    help: 'Which on-pack message lands.',
    publishable: false,
  },
  {
    value: 'positioning',
    label: 'Positioning',
    help: 'How the product is framed.',
    publishable: false,
  },
  {
    value: 'price',
    label: 'Price',
    help: 'Blind price test — which design reads as premium, and what shoppers will pay.',
    publishable: true,
  },
  {
    value: 'full_concept',
    label: 'Full concept',
    help: 'Whole propositions that differ in several ways at once. Tells you which concept wins — not which part of it won.',
    publishable: false,
  },
]

/** @deprecated Use STIMULUS_MODE_OPTIONS. */
export const STIMULUS_TYPE_OPTIONS = STIMULUS_MODE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}))

export const BATTLE_INTENT_OPTIONS: { value: BattleIntent; label: string; tag: string }[] = [
  { value: 'hero', label: 'Your arm', tag: 'hero' },
  { value: 'competitor', label: 'Competitor', tag: 'competitor' },
]

/** Concept-test UPC copy — identity, not physical scan confirmation. */
export const CONCEPT_UPC_IDENTITY_HELP =
  'Identifies exactly which competitor SKU was tested — 8oz and family size are different products in the report.'

export const PRICE_POSTURE_OPTIONS: {
  value: PricePosture
  label: string
  help: string
}[] = [
  {
    value: 'blind',
    label: 'blind',
    help: 'No prices shown — pure preference without a buy signal.',
  },
  {
    value: 'realistic',
    label: 'realistic · default',
    help: 'Every competitor priced · closest to a real buy signal.',
  },
  {
    value: 'variable',
    label: 'variable',
    help: 'Prices may differ — tests willingness across price points.',
  },
]

/**
 * Status label for study types that are not yet publishable.
 *
 * Replaces MODE_IN_PROGRESS_NOTE, which claimed "packaging studies are live
 * now" — false, since Price is publishable too, and it was printed five times
 * per render. Two words, true, and short enough not to dominate the grid.
 */
export const MODE_COMING_SOON_LABEL = 'Coming soon'
