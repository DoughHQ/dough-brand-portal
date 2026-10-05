/**
 * localStorage draft store for box studies. Drafts live only in the browser
 * until publish, mirroring the concept lane. Namespaced away from
 * dough.conceptDrafts.* so the two lanes can never collide.
 */
import { MODULE_LOYALTY, resolveBoxSelectedModules } from '@/lib/study/modules'
import type { BoxStudyDraft } from './types'
import { createEmptyBoxDraft, createEmptyBoxEligibility, createEmptyBoxFieldRow } from './defaults'
import {
  sanitizeIhutAttributes,
  sanitizeIhutSuccessBars,
  emptyIhutBrandQuestion,
  type IhutBrandQuestionDraft,
} from './method'
import {
  IHUT_RESPONDENT_WINDOW_DAYS,
  ihutInventoryPlan,
} from './completionContract'

const KEY = 'dough.boxDrafts.v1'

type DraftMap = Record<string, BoxStudyDraft>

function readMap(): DraftMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as DraftMap
    }
    return {}
  } catch {
    return {}
  }
}

function writeMap(map: DraftMap): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // Quota/serialization failures must never crash the builder.
  }
}

/** Merge stored data over fresh defaults so old drafts survive shape changes. */
export function normalizeStoredBoxDraft(
  stored: Partial<BoxStudyDraft> & { sessionCount?: 1 | 2 },
  fallbackBrandId: number
): BoxStudyDraft {
  const base = createEmptyBoxDraft(stored.brandId ?? fallbackBrandId)
  const selectedModules = resolveBoxSelectedModules({
    selectedModules: stored.selectedModules,
    loyaltyFollowUp:
      typeof stored.loyaltyFollowUp === 'boolean'
        ? stored.loyaltyFollowUp
        : typeof stored.day2LiveWithIt === 'boolean'
          ? stored.day2LiveWithIt
          : stored.sessionCount === 2,
  }).filter((m) => m === MODULE_LOYALTY)
  const day2LiveWithIt =
    typeof stored.day2LiveWithIt === 'boolean'
      ? stored.day2LiveWithIt
      : selectedModules.includes(MODULE_LOYALTY)

  const brandQuestions: IhutBrandQuestionDraft[] = Array.isArray(stored.ihutBrandQuestions)
    ? stored.ihutBrandQuestions
        .filter((q) => q && typeof q === 'object')
        .slice(0, 2)
        .map((q) => ({
          ...emptyIhutBrandQuestion(),
          ...q,
          prompt: typeof q.prompt === 'string' ? q.prompt : '',
          options: Array.isArray(q.options)
            ? q.options.filter((o): o is string => typeof o === 'string')
            : ['', ''],
          max_select: (() => {
            const legacy = q as unknown as { maxSelect?: unknown; max_select?: unknown }
            if (typeof legacy.max_select === 'number') return legacy.max_select
            if (typeof legacy.maxSelect === 'number') return legacy.maxSelect
            return 1
          })(),
          answerSource:
            q.answerSource === 'field' || q.answerSource === 'custom'
              ? q.answerSource
              : undefined,
          customOptionsStash: Array.isArray(q.customOptionsStash)
            ? q.customOptionsStash.filter((o): o is string => typeof o === 'string')
            : undefined,
        }))
    : []

  const focalId =
    typeof stored.focalProductId === 'number' ? stored.focalProductId : null
  const targetCompletions =
    typeof stored.targetCompletions === 'number' &&
    Number.isSafeInteger(stored.targetCompletions) &&
    stored.targetCompletions > 0
      ? stored.targetCompletions
      : null
  const inventory = ihutInventoryPlan(targetCompletions)
  const fieldProducts = Array.isArray(stored.fieldProducts)
    ? stored.fieldProducts
        .map((r, index) => {
          const kind =
            r.kind === 'prototype' || r.kind === 'product' ? r.kind : 'product'
          const role =
            r.role === 'yours' || r.role === 'competitor'
              ? r.role
              : focalId != null && r.product_id === focalId
                ? 'yours'
                : index === 0 && focalId == null
                  ? 'yours'
                  : 'competitor'
          return {
            ...createEmptyBoxFieldRow(),
            ...r,
            kind,
            role,
            packaging:
              r.packaging === 'plain_sample' || r.packaging === 'final_packaging'
                ? r.packaging
                : 'final_packaging',
            price:
              typeof r.price === 'number' && Number.isFinite(r.price) ? r.price : null,
            prototype_id:
              typeof r.prototype_id === 'string' && r.prototype_id
                ? r.prototype_id
                : null,
            prototypeSnapshot: r.prototypeSnapshot ?? null,
            taxonomy_node_id: r.taxonomy_node_id ?? null,
            l2_node_id: r.l2_node_id ?? null,
            upc: typeof r.upc === 'string' && r.upc.trim() ? r.upc.trim() : null,
            barcodeOptions: Array.isArray(r.barcodeOptions) ? r.barcodeOptions : [],
            frozen_category: r.frozen_category ?? null,
            identityConfirmed:
              typeof r.identityConfirmed === 'boolean'
                ? r.identityConfirmed
                : typeof r.upc === 'string' && r.upc.trim().length > 0,
          }
        })
        // Concept rule: unresolved seats never persist. Kill Kind-toggle ghosts.
        .filter((r) =>
          r.kind === 'prototype' ? !!r.prototype_id : r.product_id != null
        )
    : []
  return {
    ...base,
    ...stored,
    draftId: stored.draftId ?? base.draftId,
    fieldProducts,
    targetCompletions,
    physicalUnits: inventory?.physicalUnits ?? null,
    abandonWindowDays: IHUT_RESPONDENT_WINDOW_DAYS,
    expiresAt: base.expiresAt,
    eligibility: {
      ...createEmptyBoxEligibility(),
      ...(stored.eligibility ?? {}),
    },
    selectedModules,
    loyaltyFollowUp: day2LiveWithIt,
    day2LiveWithIt,
    battleQuestion:
      typeof stored.battleQuestion === 'string' ? stored.battleQuestion : '',
    ihutAttributes: sanitizeIhutAttributes(stored.ihutAttributes),
    ihutBrandQuestions: brandQuestions,
    ihutSuccessBars: sanitizeIhutSuccessBars(stored.ihutSuccessBars),
  }
}

export function saveBoxDraft(draft: BoxStudyDraft): BoxStudyDraft {
  const next = normalizeStoredBoxDraft(
    { ...draft, updatedAt: new Date().toISOString() },
    draft.brandId
  )
  const map = readMap()
  map[next.draftId] = next
  writeMap(map)
  return next
}

export function loadBoxDraft(draftId: string): BoxStudyDraft | null {
  const raw = readMap()[draftId]
  if (!raw) return null
  return normalizeStoredBoxDraft(raw, raw.brandId)
}

export function deleteBoxDraft(draftId: string): void {
  const map = readMap()
  if (!(draftId in map)) return
  delete map[draftId]
  writeMap(map)
}
