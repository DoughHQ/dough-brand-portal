import type { BrandPrototypeRow, PrototypeReadiness } from './types'

/** A prototype is seatable for future P1 publish only when photo + allergens exist. */
export function prototypeReadiness(
  row: Pick<
    BrandPrototypeRow,
    | 'image_paths'
    | 'allergens_declared_at'
    | 'allergens_contains'
    | 'allergens_may_contain'
    | 'name'
  >
): PrototypeReadiness {
  const hasName = row.name.trim().length > 0
  const hasPhoto = Array.isArray(row.image_paths) && row.image_paths.length > 0
  const hasAllergens =
    row.allergens_declared_at != null &&
    Array.isArray(row.allergens_contains) &&
    Array.isArray(row.allergens_may_contain)

  if (!hasName || (!hasPhoto && !hasAllergens)) return 'incomplete'
  if (!hasPhoto) return 'needs_photo'
  if (!hasAllergens) return 'needs_allergens'
  return 'ready'
}

export function readinessLabel(r: PrototypeReadiness): string {
  switch (r) {
    case 'ready':
      return 'Ready'
    case 'needs_allergens':
      return 'Needs allergens'
    case 'needs_photo':
      return 'Needs photo'
    case 'incomplete':
      return 'Incomplete'
  }
}
