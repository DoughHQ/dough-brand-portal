import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export type BrandCategoryL2 = {
  l2NodeId: number
  l2Name: string
  productCount: number
  battles: number
  productsWithBattles: number
  /** Taxonomy banner already on the launcher row — omitted when the fetch path has none. */
  bannerImageUrl?: string | null
}

/**
 * L2 categories that contain this brand's active products.
 * Honest product/battle counts only — never invents distinct raters.
 */
export async function fetchBrandCategoryL2s(brandId: number): Promise<BrandCategoryL2[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      product_id,
      total_battles,
      taxonomy_nodes!products_taxonomy_node_id_fkey (
        parent_taxonomy_node_id
      )
    `
    )
    .eq('brand_id', brandId)
    .eq('status', 'active')
    .eq('is_suppressed', false)

  if (error || !data) return []

  const byL2 = new Map<
    number,
    { productCount: number; battles: number; productsWithBattles: number }
  >()

  for (const row of data) {
    const nodes = row.taxonomy_nodes as
      | { parent_taxonomy_node_id?: number | null }
      | { parent_taxonomy_node_id?: number | null }[]
      | null
    const parentId = Array.isArray(nodes)
      ? nodes[0]?.parent_taxonomy_node_id
      : nodes?.parent_taxonomy_node_id
    if (parentId == null || !Number.isFinite(Number(parentId))) continue
    const id = Number(parentId)
    const cur = byL2.get(id) ?? { productCount: 0, battles: 0, productsWithBattles: 0 }
    const battles = Number(row.total_battles) || 0
    cur.productCount += 1
    cur.battles += battles
    if (battles > 0) cur.productsWithBattles += 1
    byL2.set(id, cur)
  }

  if (byL2.size === 0) return []

  const ids = [...byL2.keys()]
  const { data: nodes } = await supabase
    .from('taxonomy_nodes')
    .select('taxonomy_node_id, node_name_display')
    .in('taxonomy_node_id', ids)

  const nameById = new Map<number, string>()
  for (const n of nodes ?? []) {
    nameById.set(Number(n.taxonomy_node_id), String(n.node_name_display ?? 'Category'))
  }

  return ids
    .map((l2NodeId) => {
      const agg = byL2.get(l2NodeId)!
      return {
        l2NodeId,
        l2Name: nameById.get(l2NodeId) ?? `Category ${l2NodeId}`,
        productCount: agg.productCount,
        battles: agg.battles,
        productsWithBattles: agg.productsWithBattles,
      }
    })
    .sort((a, b) => b.battles - a.battles || a.l2Name.localeCompare(b.l2Name))
}

/**
 * L2 taxonomy node ids unlocked via report_purchases (category reports).
 */
export async function fetchUnlockedCategoryL2Ids(brandId: number): Promise<number[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('report_purchases')
    .select(
      `
      report_catalog_id,
      report_catalog!report_purchases_report_catalog_id_fkey (
        taxonomy_node_id,
        report_type
      )
    `
    )
    .eq('brand_id', brandId)

  if (error || !data) return []

  const ids = new Set<number>()
  for (const row of data) {
    const catalog = row.report_catalog as
      | { taxonomy_node_id?: number | null; report_type?: string | null }
      | { taxonomy_node_id?: number | null; report_type?: string | null }[]
      | null
    const entry = Array.isArray(catalog) ? catalog[0] : catalog
    const nodeId = entry?.taxonomy_node_id
    if (nodeId == null || !Number.isFinite(Number(nodeId))) continue
    ids.add(Number(nodeId))
  }
  return [...ids]
}
