/**
 * Turn preview_ihut_journey outline into Concept PreviewRunner screens.
 */

import type { PhonePreviewJourney, PhonePreviewScreen } from '@/lib/concept/journey'
import { screensFromJourney } from '@/lib/concept/preview/screensFromJourney'
import type { PreviewCombatant } from '@/lib/concept/preview/combatants'
import type { ConceptPlanScreen } from '@/lib/concept/preview/planTypes'
import type { BoxStudyDraft } from '../types'
import { isResolvedBoxSeat } from '../fieldSize'

type IhutPreviewStage = PhonePreviewScreen & {
  per_product?: boolean
  session?: number
  measures?: string
  attribute?: string
}

export type IhutPreviewJourney = Omit<PhonePreviewJourney, 'screens'> & {
  screens: IhutPreviewStage[]
  taste_only?: boolean
  include_day2?: boolean
  note?: string
}

/** Combatants from box seats — physical products keep names (not Design letters). */
export function combatantsFromBoxDraft(draft: BoxStudyDraft): PreviewCombatant[] {
  const out: PreviewCombatant[] = []
  let ref = 1
  for (const row of draft.fieldProducts) {
    if (!isResolvedBoxSeat(row)) continue
    const name =
      row.kind === 'prototype'
        ? (row.prototypeSnapshot?.name ?? row.frozen_display_name ?? `Seat ${ref}`).trim()
        : (row.frozen_display_name || `Product ${ref}`).trim()
    out.push({
      ref,
      kind: row.kind === 'prototype' ? 'concept' : 'product',
      name: name || `Seat ${ref}`,
      brand: row.frozen_brand_name?.trim() || null,
      image_url: row.frozen_image_url,
      price: typeof row.price === 'number' ? row.price : null,
    })
    ref += 1
  }
  return out
}

/**
 * Normalize IHUT outline kinds so the concept phone runner can walk them:
 * dual battle tracks → battles, per-product → one screen each, buy_order → rank.
 */
export function normalizeIhutPreviewJourney(
  journey: IhutPreviewJourney,
  combatants: PreviewCombatant[]
): PhonePreviewJourney {
  const screens: PhonePreviewScreen[] = []
  for (const stage of journey.screens) {
    if (stage.kind === 'shelf_battles' || stage.kind === 'taste_battles') {
      screens.push({
        kind: 'battles',
        prompt: stage.prompt,
        count: stage.count,
      })
      continue
    }
    if (stage.kind === 'why_followups') {
      screens.push(stage)
      continue
    }
    if (stage.kind === 'buy_order') {
      screens.push({
        kind: 'rank',
        prompt: stage.prompt ?? "Put them in the order you'd buy them",
      })
      continue
    }
    if (stage.kind === 'still_pick') {
      screens.push({
        kind: 'diagnostic',
        prompt: stage.prompt ?? 'Which would you buy again?',
        options: combatants.map((c) => c.name),
        max_select: 1,
      })
      continue
    }
    if (stage.kind === 'summary') {
      screens.push({ kind: 'summary' })
      continue
    }
    if (stage.per_product) {
      for (const c of combatants) {
        const priceLabel =
          c.price != null ? `$${Number(c.price).toFixed(2)}` : '$X'
        const prompt = (stage.prompt ?? '').replace(/\{\{price_display\}\}/g, priceLabel)
        screens.push({
          kind: stage.kind === 'brand_question' ? 'diagnostic' : stage.kind,
          prompt: prompt || stage.attribute || stage.kind,
          options: stage.options,
          max_select: stage.max_select,
          optional: stage.optional,
          subject: {
            image_url: c.image_url ?? null,
            respondent_label: c.name,
          },
        })
      }
      continue
    }
    screens.push({
      kind: stage.kind === 'brand_question' ? 'diagnostic' : stage.kind,
      prompt: stage.prompt,
      options: stage.options,
      max_select: stage.max_select,
      optional: stage.optional,
      needs_review: stage.needs_review,
    })
  }
  return {
    note: journey.note,
    counts: journey.counts,
    screens,
    field_issues: journey.field_issues ?? [],
    needs_review: journey.needs_review === true,
    estimated_minutes: journey.estimated_minutes,
  }
}

export function screensFromIhutJourney(args: {
  journey: IhutPreviewJourney
  combatants: PreviewCombatant[]
  seed: string
}): { screens: ConceptPlanScreen[]; combatants: PreviewCombatant[] } {
  const normalized = normalizeIhutPreviewJourney(args.journey, args.combatants)
  return screensFromJourney({
    journey: normalized,
    combatants: args.combatants,
    seed: args.seed,
    stimulusMode: null,
  })
}

/**
 * Chrome summary for Questions — mirrors concept's screens · minutes line.
 * Prefers RPC estimated_minutes; falls back to the ~20 min tasting-inclusive brief.
 */
export function ihutJourneyLengthLabel(
  journey: IhutPreviewJourney | null
): string | null {
  if (!journey) return null
  const totalMin = Number(journey.counts.total_min) || 0
  const totalMax = Number(journey.counts.total_max) || totalMin
  if (totalMin < 1) return null
  const screens =
    totalMin === totalMax
      ? `${totalMin} ${totalMin === 1 ? 'screen' : 'screens'}`
      : `${totalMin}–${totalMax} screens`
  const em = journey.estimated_minutes
  if (
    em &&
    Number.isFinite(em.min) &&
    Number.isFinite(em.max) &&
    em.min > 0
  ) {
    const lo = Math.max(1, Math.round(em.min))
    const hi = Math.max(lo, Math.round(em.max))
    if (lo === hi) return `${screens} · ~${lo} min`
    return `${screens} · ~${lo}–${hi} min`
  }
  return `${screens} · ~20 min`
}

export function parseIhutPreviewJourney(raw: unknown): IhutPreviewJourney | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.screens)) return null
  const counts =
    o.counts && typeof o.counts === 'object'
      ? (o.counts as IhutPreviewJourney['counts'])
      : { total_min: o.screens.length, total_max: o.screens.length }
  return {
    screens: o.screens as IhutPreviewStage[],
    counts: {
      total_min: Number(counts.total_min) || o.screens.length,
      total_max: Number(counts.total_max) || o.screens.length,
      ...(counts as object),
    },
    field_issues: Array.isArray(o.field_issues)
      ? o.field_issues.filter((x): x is string => typeof x === 'string')
      : [],
    needs_review: o.needs_review === true,
    estimated_minutes:
      o.estimated_minutes && typeof o.estimated_minutes === 'object'
        ? (o.estimated_minutes as { min: number; max: number })
        : undefined,
    taste_only: o.taste_only === true,
    include_day2: o.include_day2 === true,
    note: typeof o.note === 'string' ? o.note : undefined,
  }
}
