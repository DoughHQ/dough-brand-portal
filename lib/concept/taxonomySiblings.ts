/** Taxonomy helpers for category picker + legibility chips. */

import type { LegibilityOption } from './types'

export type TaxonomySibling = {
  taxonomy_node_id: number
  node_name_display: string
  node_name_normalized?: string
}

export function categoryPluralFromNodeName(nodeNameDisplay: string): string {
  return nodeNameDisplay.trim().toLowerCase()
}

export function taxonomyBreadcrumb(node: {
  l1_node_name?: string | null
  l2_node_name?: string | null
  node_name_display: string
}): string {
  const parts = [node.l1_node_name, node.l2_node_name, node.node_name_display]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
  return parts.join(' › ')
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
