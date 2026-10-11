export type TaxonomyNodeInfo = {
  taxonomy_node_id: number
  node_name_display: string
  node_name_normalized: string
  parent_taxonomy_node_id: number | null
  l1_node_name: string | null
  l2_node_name: string | null
  breadcrumb: string
}

export const TAXONOMY_NODE_SELECT =
  'taxonomy_node_id, node_name_display, node_name_normalized, parent_taxonomy_node_id, l1_node_name, l2_node_name'

export type TaxonomyNodeRow = {
  taxonomy_node_id: number
  node_name_display: string
  node_name_normalized: string
  parent_taxonomy_node_id: number | null
  l1_node_name: string | null
  l2_node_name: string | null
}

export function taxonomyBreadcrumb(node: {
  l1_node_name?: string | null
  l2_node_name?: string | null
  node_name_display: string
}): string {
  const parts = [node.l1_node_name, node.l2_node_name, node.node_name_display]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
  return parts.join(' › ')
}

export function toTaxonomyNodeInfo(
  row: TaxonomyNodeRow,
): TaxonomyNodeInfo {
  return {
    ...row,
    breadcrumb: taxonomyBreadcrumb(row),
  }
}
