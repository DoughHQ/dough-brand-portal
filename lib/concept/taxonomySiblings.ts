/** Taxonomy helpers for category picker + legibility chips. */

import type { LegibilityOption } from './types'
export { taxonomyBreadcrumb } from '@/lib/studies/taxonomy'

export type TaxonomySibling = {
  taxonomy_node_id: number
  node_name_display: string
  node_name_normalized?: string
}

export function categoryPluralFromNodeName(nodeNameDisplay: string): string {
  return nodeNameDisplay.trim().toLowerCase()
}

/**
 * Preselect the first four siblings (already ordered by sort_order, name).
 * Returns ID-shaped legibility options.
 */
export function preselectSiblingOptions(
  siblings: TaxonomySibling[],
  count = 4
): LegibilityOption[] {
  return siblings
    .slice(0, count)
    .filter((s) => s.node_name_display.trim())
    .map((s) => ({
      id: `tax:${s.taxonomy_node_id}` as `tax:${number}`,
      label: s.node_name_display.trim(),
      taxonomy_node_id: s.taxonomy_node_id,
    }))
}

/** @deprecated Prefer preselectSiblingOptions (ID-shaped). */
export function preselectSiblingNames(
  siblings: TaxonomySibling[],
  count = 4
): string[] {
  return preselectSiblingOptions(siblings, count).map((o) => o.label)
}
