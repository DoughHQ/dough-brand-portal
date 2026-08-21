import type {
  ConceptStudyDraft,
  LegibilityOption,
  PackagingTemplateConfig,
  ProductCompetitorRow,
  VerificationOption,
} from './types'
import { coerceBattleIntent } from './types'
import { DRAFT_STORAGE_KEY } from './constants'
import { migrateArmImageFields } from './stimuliStorage'
import { emptyPackagingTemplateConfig } from './defaults'

function isVerificationOption(value: unknown): value is VerificationOption {
  if (value == null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.label !== 'string') return false
  if (o.id === 'decoy' || o.id === 'none_of_these') return true
  if (o.id.startsWith('brand:') && typeof o.brand_id === 'number') return true
  return false
}

function isLegibilityOption(value: unknown): value is LegibilityOption {
  if (value == null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.label !== 'string') return false
  if (o.id === 'not_sure') return true
  if (o.id.startsWith('tax:') && typeof o.taxonomy_node_id === 'number') return true
  return false
}

/** Normalize templateConfig to the v4 ID-shaped contract. Discard pre-v4 string[] drafts. */
function migrateTemplateConfig(raw: unknown): PackagingTemplateConfig {
  const empty = emptyPackagingTemplateConfig()
  if (raw == null || typeof raw !== 'object') return empty
  const cfg = raw as Record<string, unknown>

  const verification = Array.isArray(cfg.verification_options)
    ? cfg.verification_options.filter(isVerificationOption)
    : []
  const legibility = Array.isArray(cfg.legibility_options)
    ? cfg.legibility_options.filter(isLegibilityOption)
    : []

  // Pre-v4 drafts stored string[] options / price_bands — abandon those arrays.
  const verificationLooksLegacy =
    Array.isArray(cfg.verification_options) &&
    cfg.verification_options.length > 0 &&
    verification.length === 0
  const legibilityLooksLegacy =
    Array.isArray(cfg.legibility_options) &&
    cfg.legibility_options.length > 0 &&
    legibility.length === 0

  return {
    category_plural:
      typeof cfg.category_plural === 'string' ? cfg.category_plural : '',
    pack_size: typeof cfg.pack_size === 'string' ? cfg.pack_size : '',
    price_display: typeof cfg.price_display === 'string' ? cfg.price_display : '',
    decoy_option: typeof cfg.decoy_option === 'string' ? cfg.decoy_option : '',
    verification_options: verificationLooksLegacy ? [] : verification,
    legibility_options: legibilityLooksLegacy ? [] : legibility,
    expected_price:
      typeof cfg.expected_price === 'string' ? cfg.expected_price : '',
    price_answer_mode: cfg.price_answer_mode === 'exact' ? 'exact' : 'bands',
  }
}

function migrateDraft(raw: ConceptStudyDraft): ConceptStudyDraft {
  return {
    ...raw,
    taxonomyNodeId: raw.taxonomyNodeId ?? null,
    templateConfig: migrateTemplateConfig(raw.templateConfig),
    conceptArms: (raw.conceptArms ?? []).map((arm) => migrateArmImageFields(arm)),
    products: (raw.products ?? []).map(migrateProductRow),
  }
}

function migrateProductRow(row: ProductCompetitorRow): ProductCompetitorRow {
  const upc = typeof row.upc === 'string' && row.upc.trim() ? row.upc.trim() : null
  return {
    ...row,
    battle_intent: coerceBattleIntent(row.battle_intent, 'competitor'),
    upc,
    frozen_category: row.frozen_category ?? null,
    identityConfirmed:
      typeof row.identityConfirmed === 'boolean' ? row.identityConfirmed : !!upc,
  }
}

function parseDrafts(raw: string | null): ConceptStudyDraft[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as ConceptStudyDraft[]
    if (!Array.isArray(parsed)) return []
    return parsed.map(migrateDraft)
  } catch {
    return []
  }
}

function readAll(): ConceptStudyDraft[] {
  if (typeof window === 'undefined') return []
  try {
    // v4 hard reset — do not migrate v3/v2 drafts (string[] options / price_bands).
    return parseDrafts(window.localStorage.getItem(DRAFT_STORAGE_KEY))
  } catch {
    return []
  }
}

function writeAll(drafts: ConceptStudyDraft[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))
}

export function listConceptDrafts(): ConceptStudyDraft[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getConceptDraft(draftId: string): ConceptStudyDraft | null {
  return readAll().find((d) => d.draftId === draftId) ?? null
}

export function saveConceptDraft(draft: ConceptStudyDraft): ConceptStudyDraft {
  const next = migrateDraft({ ...draft, updatedAt: new Date().toISOString() })
  const all = readAll().filter((d) => d.draftId !== next.draftId)
  all.unshift(next)
  writeAll(all)
  return next
}

export function deleteConceptDraft(draftId: string): void {
  writeAll(readAll().filter((d) => d.draftId !== draftId))
}
