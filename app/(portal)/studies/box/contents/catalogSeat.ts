import type { BoxFieldRow, BoxSeatRole } from '@/lib/box/types'
import type { AdminProductSearchResult } from '@/lib/queries'
import { createEmptyBoxFieldRow } from '@/lib/box/defaults'
import { categoryFromSearchResult } from '@/lib/productEntryMode'

export function catalogSeatFromPick(
  p: AdminProductSearchResult,
  role: BoxSeatRole,
  knownUpc?: string
): BoxFieldRow {
  return {
    ...createEmptyBoxFieldRow(),
    kind: 'product',
    role,
    product_id: p.product_id,
    frozen_display_name: p.product_name_clean,
    frozen_brand_name: p.brand_name,
    frozen_image_url: p.image_url ?? null,
    taxonomy_node_id: p.taxonomy_node_id ?? null,
    l2_node_id: p.l2_node_id ?? null,
    frozen_category: categoryFromSearchResult(p),
    upc: knownUpc?.trim() || null,
    identityConfirmed: false,
  }
}
