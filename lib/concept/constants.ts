import type { BattleIntent, PricePosture, StimulusType } from './types'

/** Admin test brand — Dough HQ sandbox. */
export const CONCEPT_DEFAULT_BRAND_ID = 20016372

/** Temporary default taxonomy node until a picker ships. */
export const CONCEPT_DEFAULT_TAXONOMY_NODE_ID = 9330054

export const STIMULUS_TYPE_OPTIONS: { value: StimulusType; label: string }[] = [
  { value: 'full_concept', label: 'Full concept' },
  { value: 'name', label: 'Name' },
  { value: 'package', label: 'Package' },
  { value: 'claim', label: 'Claim' },
  { value: 'flavor', label: 'Flavor' },
  { value: 'positioning', label: 'Positioning' },
  { value: 'price', label: 'Price' },
]

export const BATTLE_INTENT_OPTIONS: { value: BattleIntent; label: string; tag: string }[] = [
  { value: 'own_concept_arm', label: 'Your arm', tag: 'own arm' },
  { value: 'direct_competitor', label: 'Direct competitor', tag: 'direct competitor' },
  { value: 'jtbd_incumbent', label: 'Job-to-be-done', tag: 'job-to-be-done' },
]

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

export const DRAFT_STORAGE_KEY = 'dough.conceptDrafts.v1'
