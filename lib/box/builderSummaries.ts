import { uniquePairs } from '@/lib/concept/publish'
import { isResolvedBoxSeat } from './fieldSize'
import type { BoxStudyDraft } from './types'
import { MODULE_LOYALTY } from '@/lib/study/modules'

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

function resolvedSeats(draft: BoxStudyDraft) {
  return draft.fieldProducts.filter(isResolvedBoxSeat)
}

function yoursLabel(draft: BoxStudyDraft): string | null {
  const yours = draft.fieldProducts.find(
    (r) => r.role === 'yours' && isResolvedBoxSeat(r)
  )
  const name = yours?.frozen_display_name?.trim()
  return name || null
}

/** Setup card — identity + run scale (boxes, grace, close). */
export function summarizeBoxSetup(draft: BoxStudyDraft): string {
  const title = draft.title.trim() || null
  const hasCategory = draft.taxonomyNodeId != null

  if (!title && !hasCategory) return 'Name the study · choose a category'
  if (!title) return 'Name the study'
  if (!hasCategory) return `${title} · Choose a category`

  const units =
    draft.physicalUnits != null && draft.physicalUnits > 0
      ? plural(draft.physicalUnits, 'box', 'boxes')
      : null
  const expiresMs = Date.parse(draft.expiresAt)
  const end = Number.isFinite(expiresMs)
    ? `Ends ${new Date(expiresMs).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}`
    : null

  const parts = [title, units, end].filter(Boolean)
  return parts.join(' · ')
}

/** Field card — seats in the box and matchups. */
export function summarizeBoxContents(draft: BoxStudyDraft): string {
  const n = resolvedSeats(draft).length
  if (n === 0) return 'Add seats to the field'
  if (n < 2) {
    const yours = yoursLabel(draft)
    return yours
      ? `${yours} · add at least one more seat`
      : `${plural(n, 'seat', 'seats')} · need at least 2`
  }

  const battles = uniquePairs(n)
  return [
    plural(n, 'seat', 'seats'),
    plural(battles, 'matchup', 'matchups'),
  ].join(' · ')
}

/** Method card fallback — Questions chrome prefers live journey length. */
export function summarizeBoxMethod(draft: BoxStudyDraft): string {
  const attrs = draft.ihutAttributes?.length ?? 0
  const bq = draft.ihutBrandQuestions?.length ?? 0
  const day2 =
    draft.day2LiveWithIt === true ||
    draft.selectedModules?.includes(MODULE_LOYALTY)
  const parts = [
    'Battles + taste',
    attrs > 0 ? `${attrs} attribute${attrs === 1 ? '' : 's'}` : null,
    bq > 0 ? `${bq} brand Q${bq === 1 ? '' : 's'}` : 'No brand Qs',
    day2 ? 'Day 2 on' : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

/** @deprecated Use summarizeBoxMethod. */
export function summarizeBoxBattle(draft: BoxStudyDraft): string {
  return summarizeBoxMethod(draft)
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

/** @deprecated Prefer summarizeBoxSetup — logistics lives in Setup. */
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
  const n = resolvedSeats(draft).length
  const battles = uniquePairs(n)
  const units = draft.physicalUnits ?? 0
  return [
    `${n} in box`,
    plural(battles, 'matchup', 'matchups'),
    plural(Math.max(0, units), 'box', 'boxes'),
  ].join(' · ')
}
