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
 * @deprecated FORBIDDEN — throws. Use get_brand_category_launcher / snapshot categories_top.
 */
export async function fetchBrandCategoryL2s(_brandId: number): Promise<never> {
  throw new Error(
    'FORBIDDEN: fetchBrandCategoryL2s is a catalog landmine. Use get_brand_category_launcher or get_brand_home_snapshot.'
  )
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
