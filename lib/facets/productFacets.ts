/** Brand-declarable product facet surface — portal types. */

import { formatProofCode } from '@/lib/transparency/displayMap'

export type FacetSummaryRow = {
  product_id: number
  derived_count: number
  declared_count: number
  pending_count: number
  declarable_total: number
  declarable_filled: number
  completeness_pct: number
}

export type FacetAvailableValue = {
  value: string
  label: string
}

export type FacetDeclaredValue = {
  value: string
  declaration_id: number
  review_state: string
  /** facet_values.display_name from the RPC — omit when blank. */
  label?: string
}

export type FacetDerivedValue = {
  value: string
  source: string | null
  /** facet_values.display_name from the RPC — omit when blank. */
  label?: string
}

export type DeclarableFacetRow = {
  facet_type: string
  display_name: string
  cardinality: 'single' | 'multi' | string
  polarity: string
  assignability: string
  /** When false: Dough-known only — chips, no picker. */
  editable: boolean
  requires_evidence: boolean
  available_values: FacetAvailableValue[] | null
  derived_values: FacetDerivedValue[] | null
  declared_values: FacetDeclaredValue[] | null
}

/**
 * Derived labels that must never render as Sage chips.
 * Empty after diet_zero → intense_sweetener; keep the hook for future poison.
 */
export const DERIVED_FACET_DENYLIST = new Set<string>()

export function isDeniedDerived(facetType: string, value: string): boolean {
  const v = value.trim().toLowerCase()
  const t = facetType.trim().toLowerCase()
  return DERIVED_FACET_DENYLIST.has(v) || DERIVED_FACET_DENYLIST.has(`${t}:${v}`)
}

/** Trimmed display label; `display_name` accepted as an RPC alias. Never spreads extras. */
function pickLabel(item: object): string | undefined {
  const rec = item as { label?: unknown; display_name?: unknown }
  const raw = rec.label ?? rec.display_name
  if (raw == null) return undefined
  const s = String(raw).trim()
  return s || undefined
}

/** Accept RPC `{ value, source, label }` or legacy bare strings. */
export function normalizeDerivedValues(
  raw: unknown,
): FacetDerivedValue[] {
  if (!Array.isArray(raw)) return []
  const out: FacetDerivedValue[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      const value = item.trim()
      if (value) out.push({ value, source: null })
      continue
    }
    if (item && typeof item === 'object' && 'value' in item) {
      const value = String((item as { value: unknown }).value ?? '').trim()
      if (!value) continue
      const sourceRaw = (item as { source?: unknown }).source
      const next: FacetDerivedValue = {
        value,
        source: sourceRaw == null || sourceRaw === '' ? null : String(sourceRaw),
      }
      const label = pickLabel(item)
      if (label) next.label = label
      out.push(next)
    }
  }
  return out
}

export function normalizeDeclaredValues(raw: unknown): FacetDeclaredValue[] {
  if (!Array.isArray(raw)) return []
  const out: FacetDeclaredValue[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as { value?: unknown; declaration_id?: unknown; review_state?: unknown }
    const value = String(rec.value ?? '').trim()
    const declaration_id = Number(rec.declaration_id)
    if (!value || !Number.isFinite(declaration_id)) continue
    const next: FacetDeclaredValue = {
      value,
      declaration_id,
      review_state: String(rec.review_state ?? ''),
    }
    const label = pickLabel(item)
    if (label) next.label = label
    out.push(next)
  }
  return out
}

export function filterDerivedValues(
  facetType: string,
  values: FacetDerivedValue[] | string[] | null | undefined,
): FacetDerivedValue[] {
  return normalizeDerivedValues(values).filter((d) => !isDeniedDerived(facetType, d.value))
}

/**
 * Chip / summary copy for a facet value.
 * Prefer the item's RPC label, then picker vocabulary, then a humanised code.
 * Never uses the facet *type* display_name.
 * The formatProofCode fallback is defensive — no live derived-only value has a blank display_name.
 */
export function facetValueLabel(
  row: Pick<DeclarableFacetRow, 'available_values'>,
  value: string,
  label?: string | null,
): string {
  const fromItem = (label ?? '').trim()
  if (fromItem) return fromItem
  const hit = (row.available_values ?? []).find((v) => v.value === value)
  const fromVocab = hit?.label?.trim()
  if (fromVocab) return fromVocab
  return formatProofCode(value) || value
}

const SOURCE_LABELS: Record<string, string> = {
  product_name: 'From the product name',
  ingredients: 'From the ingredient list',
  ingredient_list: 'From the ingredient list',
  label: 'From the label',
  nutrition: 'From nutrition facts',
  brand_submitted: 'From a brand disclosure',
  disclosure: 'From a brand disclosure',
}

/** Human provenance for derived chips — never surface batch/migration names. */
export function provenanceLabelFromSource(source: string | null | undefined): string {
  if (!source?.trim()) return 'Derived by Dough'
  const key = source.trim().toLowerCase()
  if (SOURCE_LABELS[key]) return SOURCE_LABELS[key]!
  // Batch / merge / job names → generic
  if (/^(node_|job_|batch_|mig_|merge_)/i.test(source) || /_20\d{6}/.test(source)) {
    return 'Derived by Dough'
  }
  if (key.includes('product_name') || key.includes('name')) return 'From the product name'
  if (key.includes('ingredient')) return 'From the ingredient list'
  return 'Derived by Dough'
}

export function rowIsPickerEditable(row: Pick<DeclarableFacetRow, 'editable' | 'available_values'>): boolean {
  if (row.editable === false) return false
  return (row.available_values ?? []).length > 0
}

export function formatFacetFooterLine(row: FacetSummaryRow): string | null {
  if (row.declarable_total === 0) return null
  const canAdd = Math.max(0, row.declarable_total - row.declarable_filled)
  const parts: string[] = [`${row.derived_count} attributes from Dough`]
  if (row.declared_count > 0) {
    parts.push(`${row.declared_count} you've added`)
  }
  // First-open: soft invitation, not a deficit scoreboard.
  if (row.declarable_filled === 0 && row.declared_count === 0) {
    parts.push('add what only you know')
  } else if (canAdd > 0) {
    parts.push(`${canAdd} you can add`)
  }
  return parts.join(' · ')
}

/** Styled footer segments — same copy rules as formatFacetFooterLine. */
export function facetFooterParts(
  row: FacetSummaryRow,
): { text: string; className?: string }[] | null {
  if (row.declarable_total === 0) return null
  const canAdd = Math.max(0, row.declarable_total - row.declarable_filled)
  const parts: { text: string; className?: string }[] = [
    { text: `${row.derived_count} attributes from Dough` },
  ]
  if (row.declared_count > 0) {
    parts.push({ text: `${row.declared_count} you've added`, className: 'pf-footer__added' })
  }
  if (row.declarable_filled === 0 && row.declared_count === 0) {
    parts.push({ text: 'add what only you know' })
  } else if (canAdd > 0) {
    parts.push({ text: `${canAdd} you can add` })
  }
  return parts
}

/** Values shoppers can filter/find — derived + live declared, denylist applied. */
export function composeShopperFacetLine(rows: DeclarableFacetRow[]): string {
  const parts: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const derived = filterDerivedValues(row.facet_type, row.derived_values)
    for (const d of derived) {
      const key = `${row.facet_type}:${d.value}`
      if (seen.has(key)) continue
      seen.add(key)
      parts.push(facetValueLabel(row, d.value, d.label))
    }
    for (const dec of row.declared_values ?? []) {
      const s = (dec.review_state || '').toLowerCase()
      if (s === 'pending' || s === 'rejected' || s === 'withdrawn') continue
      const key = `${row.facet_type}:${dec.value}`
      if (seen.has(key)) continue
      seen.add(key)
      parts.push(facetValueLabel(row, dec.value, dec.label))
    }
  }
  return parts.join(' · ')
}

/** Prefer combobox over radio walls once vocabulary is this long. */
export const FACET_LIST_SEARCH_THRESHOLD = 8

const HINT_MESSAGES: Record<string, string> = {
  FACET_TYPE_DERIVED_ONLY: "Dough derives this from the ingredient list. It can't be edited here.",
  FACET_VALUE_NOT_IN_VOCABULARY: 'Choose a value from the list.',
  FACET_OUT_OF_SCOPE: "This attribute doesn't apply to this category.",
  EVIDENCE_REQUIRED: 'Add a link to your certification.',
  CROSS_TENANT_ACCESS_DENIED: "You don't have access to this product.",
  PRODUCT_NOT_EDITABLE: "This product can't be edited.",
  PRODUCT_IS_TOMBSTONE: 'This product was merged into another record.',
  PRODUCT_NOT_FOUND: 'Product not found.',
  BATCH_TOO_LARGE: 'Too many products in one request. Retrying in smaller batches…',
}

export function messageFromFacetError(error: {
  message?: string
  hint?: string | null
  details?: string | null
} | null): string {
  if (!error) return 'Something went wrong. Try again.'
  const hint = (error.hint || error.details || '').trim()
  if (hint && HINT_MESSAGES[hint]) return HINT_MESSAGES[hint]
  for (const key of Object.keys(HINT_MESSAGES)) {
    if ((error.message || '').includes(key) || hint.includes(key)) {
      return HINT_MESSAGES[key]!
    }
  }
  return error.message?.trim() || 'Something went wrong. Try again.'
}
