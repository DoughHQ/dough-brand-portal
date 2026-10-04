/** Allergen vocabulary for prototype declarations (FDA nine + gluten). */

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

export function isAllergenCode(value: string): value is AllergenCode {
  return (ALLERGEN_CODES as readonly string[]).includes(value)
}

export function labelAllergens(codes: Iterable<string>): string {
  return [...codes]
    .map((c) => ALLERGEN_LABELS[c as AllergenCode] ?? c)
    .join(', ')
}

export function allergenSummary(contains: string[], mayContain: string[]): string {
  if (contains.length === 0 && mayContain.length === 0) return 'None declared'
  const parts: string[] = []
  if (contains.length > 0) parts.push(`Contains ${labelAllergens(contains)}`)
  if (mayContain.length > 0) parts.push(`May contain ${labelAllergens(mayContain)}`)
  return parts.join(' · ')
}
