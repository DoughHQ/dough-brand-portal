/** Brand prototype library — durable assets for IHUT seats (method §§10–12). */

export type PrototypePackaging = 'plain_sample' | 'final_packaging'

export type BrandPrototypeRow = {
  id: string
  brand_id: number
  name: string
  internal_label: string | null
  taxonomy_node_id: number
  packaging: PrototypePackaging
  planned_price: number | null
  image_paths: string[]
  allergens_contains: string[] | null
  allergens_may_contain: string[] | null
  allergens_declared_at: string | null
  allergens_declared_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
  archived_by: string | null
}

export type PrototypeReadiness = 'ready' | 'needs_allergens' | 'needs_photo' | 'incomplete'

export type PrototypeListItem = BrandPrototypeRow & {
  readiness: PrototypeReadiness
  category_label: string | null
}

export type PrototypeSaveInput = {
  prototypeId: string | null
  brandId: number
  name: string
  internalLabel: string | null
  taxonomyNodeId: number
  packaging: PrototypePackaging
  plannedPrice: number | null
  imagePaths: string[]
}

export type PrototypeAllergenInput = {
  prototypeId: string
  contains: string[]
  mayContain: string[]
}
