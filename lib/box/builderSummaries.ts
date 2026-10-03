import { BOX_DEFAULT_BATTLE_QUESTION } from './constants'
import { uniquePairs } from '@/lib/concept/publish'
import type { BoxStudyDraft } from './types'

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

function resolvedProducts(draft: BoxStudyDraft) {
  return draft.fieldProducts.filter((r) => r.product_id != null)
}

function focalName(draft: BoxStudyDraft): string | null {
  const row = draft.fieldProducts.find((r) => r.product_id === draft.focalProductId)
  const name = row?.frozen_display_name?.trim()
  return name || null
}

/** Setup card — study name + hero (category lives on the hero). */
export function summarizeBoxSetup(draft: BoxStudyDraft): string {
  const title = draft.title.trim() || null
  const hero = focalName(draft)

  if (!title && !hero) {
    return draft.taxonomyNodeId != null
      ? 'Name the study · pick a hero'
      : 'Name the study · choose a hero product'
  }
  if (!title) return `Name the study · ${hero}`
  if (!hero) return `${title} · Choose a hero product`
  return `${title} · ${hero}`
}

/** Field card — products in the box and matchups. */
export function summarizeBoxContents(draft: BoxStudyDraft): string {
  const n = resolvedProducts(draft).length
  if (n === 0) return 'Add products to the field'
  if (n < 2) return `${plural(n, 'product', 'products')} · need at least 2`

  const battles = uniquePairs(n)
  return [
    plural(n, 'product', 'products'),
    plural(battles, 'matchup', 'matchups'),
  ].join(' · ')
}

/** Battle card — prompt respondents will see. */
export function summarizeBoxBattle(draft: BoxStudyDraft): string {
  const custom = draft.battleQuestion.trim()
  if (!custom) return `Dough default · “${BOX_DEFAULT_BATTLE_QUESTION}”`
  const clipped = custom.length > 64 ? `${custom.slice(0, 61)}…` : custom
  return `Your prompt · “${clipped}”`
}

/** Audience card — open vs restricted. */
export function summarizeBoxAudience(draft: BoxStudyDraft): string {
  const e = draft.eligibility
  const parts: string[] = []
  if (draft.eligibilityTier === 'tried') parts.push('Must have tried hero')
  else if (draft.eligibilityTier === 'not_tried') parts.push('Must not have tried hero')
  if (e.targetStates.length > 0) {
    parts.push(
      e.targetStates.length === 1
        ? e.targetStates[0]!
        : `${e.targetStates.length} states`
    )
  }
  if (e.minCategoryLevel != null) parts.push(`Level ${e.minCategoryLevel}+`)
  if (e.minCategoryTries != null) {
    parts.push(plural(e.minCategoryTries, 'try', 'tries') + ' min')
  }
  if (e.requiredDietaryFlags.length > 0) {
    parts.push(
      plural(e.requiredDietaryFlags.length, 'dietary flag', 'dietary flags')
    )
  }
  if (parts.length === 0) return 'Open to everyone'
  return parts.slice(0, 3).join(' · ')
}

/** Logistics card — boxes, pacing, end. */
export function summarizeBoxLogistics(draft: BoxStudyDraft): string {
  const units =
    draft.physicalUnits != null && draft.physicalUnits > 0
      ? plural(draft.physicalUnits, 'box', 'boxes')
      : 'Set box count'
  const abandon = `${draft.abandonWindowDays}d abandon`
  const expiresMs = Date.parse(draft.expiresAt)
  const end = Number.isFinite(expiresMs)
    ? `Ends ${new Date(expiresMs).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}`
    : 'Set end date'
  return [units, abandon, end].join(' · ')
}

/** Sticky dock when the box can publish. */
export function summarizeBoxDockReady(draft: BoxStudyDraft): string {
  const n = resolvedProducts(draft).length
  const battles = uniquePairs(n)
  const units = draft.physicalUnits ?? 0
  return [
    `${n} in box`,
    plural(battles, 'matchup', 'matchups'),
    plural(Math.max(0, units), 'box', 'boxes'),
  ].join(' · ')
}
