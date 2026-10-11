/** Live dietary_flag_definitions grouping for box eligibility chips. */

export const DIETARY_FLAG_CATEGORY_ORDER = [
  'allergy',
  'diet',
  'avoid',
  'lifestyle',
  'religious',
  'health_condition',
  'safety',
] as const

export const DIETARY_FLAG_CATEGORY_HEADINGS: Record<
  (typeof DIETARY_FLAG_CATEGORY_ORDER)[number],
  string
> = {
  allergy: 'Allergens',
  diet: 'Diets',
  avoid: 'Avoids',
  lifestyle: 'Lifestyle',
  religious: 'Religious',
  health_condition: 'Health',
  safety: 'Safety',
}

export type DietaryFlagDef = {
  flag_code: string
  label: string
  category: string
  display_order: number | null
}

export type DietaryFlagGroup = {
  category: string
  heading: string
  flags: DietaryFlagDef[]
}

function headingFor(category: string): string {
  if (category in DIETARY_FLAG_CATEGORY_HEADINGS) {
    return DIETARY_FLAG_CATEGORY_HEADINGS[
      category as (typeof DIETARY_FLAG_CATEGORY_ORDER)[number]
    ]
  }
  return category
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Preserve query order (display_order, flag_code) within each category. */
export function groupDietaryFlags(flags: DietaryFlagDef[]): DietaryFlagGroup[] {
  const byCat = new Map<string, DietaryFlagDef[]>()
  for (const flag of flags) {
    const category = flag.category.trim() || 'other'
    const list = byCat.get(category)
    if (list) list.push(flag)
    else byCat.set(category, [flag])
  }

  for (const list of byCat.values()) {
    list.sort((a, b) => {
      const ao = a.display_order ?? Number.POSITIVE_INFINITY
      const bo = b.display_order ?? Number.POSITIVE_INFINITY
      if (ao !== bo) return ao - bo
      return a.flag_code.localeCompare(b.flag_code)
    })
  }

  const known = new Set<string>(DIETARY_FLAG_CATEGORY_ORDER)
  const extras = [...byCat.keys()].filter((c) => !known.has(c)).sort()
  const order = [
    ...DIETARY_FLAG_CATEGORY_ORDER.filter((c) => byCat.has(c)),
    ...extras,
  ]

  return order.map((category) => ({
    category,
    heading: headingFor(category),
    flags: byCat.get(category) ?? [],
  }))
}
