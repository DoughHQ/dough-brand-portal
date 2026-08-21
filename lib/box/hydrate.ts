import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { loadProductBarcodeState } from '@/lib/concept/barcodes'
import { categoryFromSearchResult } from '@/lib/productEntryMode'
import type { BoxFieldRow } from './types'

export type BoxProductPick = {
  product_id: number
  product_name_clean: string
  brand_name: string
  image_url: string | null
  taxonomy_node_id: number | null
  l2_node_id: number | null
  l3_name?: string | null
  l2_name?: string | null
  l1_name?: string | null
}

export async function hydrateBoxFieldRow(
  supabase: SupabaseClient<Database>,
  base: BoxFieldRow,
  pick: BoxProductPick,
  knownUpc?: string
): Promise<BoxFieldRow> {
  let upc = knownUpc?.trim() || null
  let barcodeOptions = base.barcodeOptions ?? []
  try {
    const state = await loadProductBarcodeState(supabase, pick.product_id, knownUpc)
    upc = state.upc
    barcodeOptions = state.barcodeOptions
  } catch {
    // Validity will require a UPC; the row is still usable as a product pick.
  }
  return {
    ...base,
    product_id: pick.product_id,
    frozen_display_name: pick.product_name_clean,
    frozen_brand_name: pick.brand_name,
    frozen_image_url: pick.image_url ?? null,
    taxonomy_node_id: pick.taxonomy_node_id ?? null,
    l2_node_id: pick.l2_node_id ?? null,
    frozen_category: base.frozen_category ?? categoryFromSearchResult(pick),
    upc,
    barcodeOptions,
  }
}
