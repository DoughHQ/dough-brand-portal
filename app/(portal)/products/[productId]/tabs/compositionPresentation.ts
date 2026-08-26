import type { MasterDietary, MasterSku, SkuNutrition } from '@/lib/productMaster/types'

export const DIETARY_FLAG_LABELS = [
  ['is_gluten_free', 'Gluten free'],
  ['is_vegan', 'Vegan'],
  ['is_vegetarian', 'Vegetarian'],
  ['is_organic', 'Organic'],
  ['is_non_gmo', 'Non-GMO'],
  ['is_kosher', 'Kosher'],
  ['is_halal', 'Halal'],
  ['is_keto_friendly', 'Keto'],
  ['is_paleo', 'Paleo'],
] as const

const NUTRITION_VALUE_KEYS = [
  'calories',
  'total_fat_g',
  'saturated_fat_g',
  'trans_fat_g',
  'cholesterol_mg',
  'sodium_mg',
  'total_carbs_g',
  'dietary_fiber_g',
  'total_sugars_g',
  'added_sugars_g',
  'protein_g',
  'vitamin_d_mcg',
  'calcium_mg',
  'iron_mg',
  'potassium_mg',
  'vitamin_a_mcg',
  'vitamin_c_mg',
] as const

const UNMAPPED_NUTRIENT = /^nutrient_\d+$/

export const MACRO_ROWS: { key: string; label: string; suffix?: string }[] = [
  { key: 'calories', label: 'Calories' },
  { key: 'total_fat_g', label: 'Total fat', suffix: 'g' },
  { key: 'saturated_fat_g', label: 'Saturated fat', suffix: 'g' },
  { key: 'trans_fat_g', label: 'Trans fat', suffix: 'g' },
  { key: 'cholesterol_mg', label: 'Cholesterol', suffix: 'mg' },
  { key: 'sodium_mg', label: 'Sodium', suffix: 'mg' },
  { key: 'total_carbs_g', label: 'Total carbs', suffix: 'g' },
  { key: 'dietary_fiber_g', label: 'Dietary fiber', suffix: 'g' },
  { key: 'total_sugars_g', label: 'Total sugars', suffix: 'g' },
  { key: 'added_sugars_g', label: 'Added sugars', suffix: 'g' },
  { key: 'protein_g', label: 'Protein', suffix: 'g' },
]

export const MICRO_ROWS: { key: string; label: string; suffix?: string }[] = [
  { key: 'vitamin_d_mcg', label: 'Vitamin D', suffix: 'mcg' },
  { key: 'calcium_mg', label: 'Calcium', suffix: 'mg' },
  { key: 'iron_mg', label: 'Iron', suffix: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', suffix: 'mg' },
  { key: 'vitamin_a_mcg', label: 'Vitamin A', suffix: 'mcg' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', suffix: 'mg' },
]

export function activeDietaryFlags(
  dietary: NonNullable<MasterDietary>
): { key: string; label: string }[] {
  return DIETARY_FLAG_LABELS.filter(([key]) => dietary[key]).map(([key, label]) => ({
    key,
    label,
  }))
}

export function dietaryContainsItems(dietary: NonNullable<MasterDietary>): string[] {
  if (!dietary.contains) return []
  return Object.entries(dietary.contains)
    .filter(([, value]) => value)
    .map(([key]) => key.replace(/_/g, ' '))
}

export function skuHasIngredientStatement(sku: MasterSku): boolean {
  return Boolean(sku.ingredients?.ingredients_text_raw?.trim())
}

/** Label data is often ALL CAPS — present as title case when the whole string is uppercase. */
export function displayAllCapsPhrase(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const letters = trimmed.replace(/[^A-Za-z]/g, '')
  if (letters.length >= 3 && letters === letters.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .replace(/(^|[\s/(&\-])([a-z])/g, (_, p1: string, p2: string) => p1 + p2.toUpperCase())
      .replace(/\s(And|Or|Of|The|With)\s/g, (match) => match.toLowerCase())
  }
  return trimmed
}

/** Visual split of a stored ingredient statement. Does not change the source string. */
export function splitIngredientStatement(raw: string): string[] {
  const trimmed = raw.trim()
  if (!trimmed) return []
  const parts = trimmed
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : [trimmed]
}

export function skuHasNutritionFacts(sku: MasterSku): boolean {
  const n = sku.nutrition
  if (!n) return false
  if (n.serving_size_value != null) return true
  for (const key of NUTRITION_VALUE_KEYS) {
    if ((n as unknown as Record<string, unknown>)[key] != null) return true
  }
  return Object.entries(n.extended_nutrients ?? {}).some(
    ([key, value]) => !UNMAPPED_NUTRIENT.test(key) && value != null
  )
}

export type NutrientRow = { label: string; value: string }

function amount(value: unknown, suffix?: string): string {
  if (value == null) return ''
  return suffix ? `${value} ${suffix}` : String(value)
}

export function servingRow(n: SkuNutrition): NutrientRow | null {
  if (n.serving_size_value == null) return null
  const uom = n.serving_size_uom ? ` ${n.serving_size_uom}` : ''
  return { label: 'Serving', value: `${n.serving_size_value}${uom}` }
}

export function presentRows(
  n: SkuNutrition,
  defs: { key: string; label: string; suffix?: string }[]
): NutrientRow[] {
  const record = n as unknown as Record<string, unknown>
  return defs.flatMap((def) => {
    const value = record[def.key]
    if (value == null) return []
    return [{ label: def.label, value: amount(value, def.suffix) }]
  })
}

export function extendedNutrientRows(n: SkuNutrition): NutrientRow[] {
  return Object.entries(n.extended_nutrients ?? {})
    .filter(([key, value]) => !UNMAPPED_NUTRIENT.test(key) && value != null)
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' '),
      value: String(value),
    }))
}

export function nutritionSummary(n: SkuNutrition): NutrientRow[] {
  const strip: NutrientRow[] = []
  if (n.calories != null) strip.push({ label: 'Calories', value: String(n.calories) })
  if (n.protein_g != null) strip.push({ label: 'Protein', value: `${n.protein_g} g` })
  if (n.total_carbs_g != null) strip.push({ label: 'Carbs', value: `${n.total_carbs_g} g` })
  if (n.total_fat_g != null) strip.push({ label: 'Fat', value: `${n.total_fat_g} g` })
  if (n.calories == null || strip.length < 3) return []
  return strip
}
