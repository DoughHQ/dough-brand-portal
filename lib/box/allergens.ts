/** IHUT allergen vocabulary + draft helpers (P0b). */

export const ALLERGEN_CODES = [
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'tree_nuts',
  'peanuts',
  'wheat',
  'soybeans',
  'sesame',
  'gluten',
] as const

export type AllergenCode = (typeof ALLERGEN_CODES)[number]

export const ALLERGEN_LABELS: Record<AllergenCode, string> = {
  milk: 'Milk',
  eggs: 'Eggs',
  fish: 'Fish',
  shellfish: 'Crustacean shellfish',
  tree_nuts: 'Tree nuts',
  peanuts: 'Peanuts',
  wheat: 'Wheat',
  soybeans: 'Soybeans',
  sesame: 'Sesame',
  gluten: 'Gluten (wheat, barley, rye)',
}

export type BoxAllergenPrefill = {
  status: string
  contains: string[]
  may_contain: string[]
  needs_label_confirm: boolean
}

export function isAllergenCode(value: string): value is AllergenCode {
  return (ALLERGEN_CODES as readonly string[]).includes(value)
}

/** Operator has tapped confirm with both lists present (empty = declared none). */
export function isAllergenConfirmed(row: {
  allergensConfirmed?: boolean
  allergensContains?: string[] | null
  allergensMayContain?: string[] | null
}): boolean {
  return (
    row.allergensConfirmed === true &&
    Array.isArray(row.allergensContains) &&
    Array.isArray(row.allergensMayContain)
  )
}

export function allergenSeatsForCount(
  rows: Array<{
    product_id: number | null
    allergensContains?: string[] | null
    allergensMayContain?: string[] | null
    allergensConfirmed?: boolean
  }>
): Array<{ contains: string[]; may_contain: string[] }> {
  return rows
    .filter((r) => r.product_id != null && isAllergenConfirmed(r))
    .map((r) => ({
      contains: r.allergensContains ?? [],
      may_contain: r.allergensMayContain ?? [],
    }))
}

export function parseAllergenPrefill(data: unknown): BoxAllergenPrefill | null {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return null
  const rec = data as Record<string, unknown>
  const contains = Array.isArray(rec.contains)
    ? rec.contains.filter((x): x is string => typeof x === 'string')
    : []
  const may = Array.isArray(rec.may_contain)
    ? rec.may_contain.filter((x): x is string => typeof x === 'string')
    : []
  return {
    status: typeof rec.status === 'string' ? rec.status : 'unknown',
    contains,
    may_contain: may,
    needs_label_confirm: rec.needs_label_confirm === true,
  }
}
