/**
 * localStorage draft store for box studies. Drafts live only in the browser
 * until publish, mirroring the concept lane. Namespaced away from
 * dough.conceptDrafts.* so the two lanes can never collide.
 */
import type { BoxStudyDraft } from './types'
import { createEmptyBoxDraft, createEmptyBoxEligibility } from './defaults'

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
  return {
    ...base,
    ...stored,
    draftId: stored.draftId ?? base.draftId,
        fieldProducts: Array.isArray(stored.fieldProducts)
      ? stored.fieldProducts.map((r) => ({
          ...r,
          taxonomy_node_id: r.taxonomy_node_id ?? null,
          l2_node_id: r.l2_node_id ?? null,
          upc: typeof r.upc === 'string' && r.upc.trim() ? r.upc.trim() : null,
          barcodeOptions: Array.isArray(r.barcodeOptions) ? r.barcodeOptions : [],
          frozen_category: r.frozen_category ?? null,
          identityConfirmed:
            typeof r.identityConfirmed === 'boolean'
              ? r.identityConfirmed
              : typeof r.upc === 'string' && r.upc.trim().length > 0,
        }))
      : [],
    eligibility: {
      ...createEmptyBoxEligibility(),
      ...(stored.eligibility ?? {}),
    },
    loyaltyFollowUp:
      typeof stored.loyaltyFollowUp === 'boolean'
        ? stored.loyaltyFollowUp
        : stored.sessionCount === 2,
    battleQuestion:
      typeof stored.battleQuestion === 'string' ? stored.battleQuestion : '',
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
