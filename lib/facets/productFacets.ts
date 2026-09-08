/** Brand-declarable product facet surface — portal types. */

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
}

export type FacetDerivedValue = {
  value: string
  source: string | null
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

/** Poison derived labels — never show as Sage “Derived by Dough” chips. */
export const DERIVED_FACET_DENYLIST = new Set(['sweetener:diet_zero', 'diet_zero'])

export function isDeniedDerived(facetType: string, value: string): boolean {
  const v = value.trim().toLowerCase()
  const t = facetType.trim().toLowerCase()
  return DERIVED_FACET_DENYLIST.has(v) || DERIVED_FACET_DENYLIST.has(`${t}:${v}`)
}

/** Accept RPC `{ value, source }` or legacy bare strings. */
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
      out.push({
        value,
        source: sourceRaw == null || sourceRaw === '' ? null : String(sourceRaw),
      })
    }
  }
  return out
}

export function filterDerivedValues(
  facetType: string,
  values: FacetDerivedValue[] | string[] | null | undefined,
): FacetDerivedValue[] {
  const normalized = Array.isArray(values)
    ? typeof values[0] === 'string'
      ? normalizeDerivedValues(values)
      : (values as FacetDerivedValue[])
    : []
  return normalized.filter((d) => !isDeniedDerived(facetType, d.value))
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
export function composeShopperFacetLine(
  rows: DeclarableFacetRow[],
  labelOf: (facetType: string, value: string) => string,
): string {
  const parts: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const derived = filterDerivedValues(row.facet_type, row.derived_values)
    for (const d of derived) {
      const key = `${row.facet_type}:${d.value}`
      if (seen.has(key)) continue
      seen.add(key)
      parts.push(labelOf(row.facet_type, d.value))
    }
    for (const dec of row.declared_values ?? []) {
      const s = (dec.review_state || '').toLowerCase()
      if (s === 'pending' || s === 'rejected' || s === 'withdrawn') continue
      const key = `${row.facet_type}:${dec.value}`
      if (seen.has(key)) continue
      seen.add(key)
      parts.push(labelOf(row.facet_type, dec.value))
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
