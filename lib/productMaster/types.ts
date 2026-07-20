/** Shape of `get_product_master` — do not invent fields beyond this contract. */

export type EvidenceRung =
  | 'synthetic'
  | 'inferred'
  | 'imported'
  | 'authoritative'
  | 'brand_added'
  | 'brand_stated'
  | 'brand_verified'
  | 'human_verified'

export type ProductMasterProduct = {
  product_id: number
  row_version: number
  brand_id: number | null
  brand_name: string | null
  product_name_display: string | null
  product_name_short: string | null
  product_flavor_variant: string | null
  product_variety: string | null
  product_description: string | null
  status: string
  is_suppressed: boolean
  taxonomy_node_id: number | null
  category_path: string | null
  category_name: string | null
  l3_source: string | null
  l3_confidence_score: number | null
  primary_image_url: string | null
  is_age_restricted: boolean
  created_at: string
  updated_at: string
}

export type SkuNutrition = {
  sku_nutrition_facts_id: number
  row_version: number
  serving_size_value: number | null
  serving_size_uom: string | null
  servings_per_container: number | null
  calories: number | null
  total_fat_g: number | null
  saturated_fat_g: number | null
  trans_fat_g: number | null
  cholesterol_mg: number | null
  sodium_mg: number | null
  total_carbs_g: number | null
  dietary_fiber_g: number | null
  total_sugars_g: number | null
  added_sugars_g: number | null
  protein_g: number | null
  vitamin_d_mcg: number | null
  calcium_mg: number | null
  iron_mg: number | null
  potassium_mg: number | null
  vitamin_a_mcg: number | null
  vitamin_c_mg: number | null
  extended_nutrients: Record<string, unknown>
  basis_type: string | null
  source_type: string | null
  is_human_verified: boolean
  evidence_rung: EvidenceRung | string | null
  locked: boolean
}

export type SkuIngredients = {
  sku_ingredients_id: number
  row_version: number
  ingredients_text_raw: string | null
  allergens_contains: string[] | null
  allergens_may_contain: string[] | null
  source_type: string | null
  is_human_verified: boolean
  evidence_rung: EvidenceRung | string | null
  locked: boolean
}

export type MasterSku = {
  sku_variant_id: number
  row_version: number
  variant_name_display: string | null
  package_size_value: number | null
  package_size_uom: string | null
  package_count: number | null
  package_type: string | null
  status: string
  is_available: boolean
  barcode: string | null
  nutrition: SkuNutrition | null
  ingredients: SkuIngredients | null
  msrp: number | null
}

export type MasterImage = {
  product_image_id: number
  sku_variant_id: number | null
  image_role: string
  public_url: string | null
  is_primary: boolean
  evidence_rung: EvidenceRung | string | null
  source_type: string | null
  captured_at: string | null
  superseded_by_id: number | null
}

export type CompareGroupEligible = {
  compare_group_id: number
  name: string | null
  consumer_question: string | null
  battle_level: string | null
  has_results: boolean
}

export type CompareGroupResult = {
  compare_group_id: number
  name: string | null
  consumer_question: string | null
  elo_score: number | null
  battles: number | null
  battles_won: number | null
  job_rank: number | null
  job_total: number | null
  rank_comparable: boolean | null
  component_id: number | null
  maturity: number | null
  seed_source: string | null
  confidence_interval: null
  publishable: boolean
}

export type PriceObserved = {
  observations: number
  publishable: boolean
  median: number | null
  min?: number | null
  max?: number | null
}

export type MsrpVsObserved = {
  delta: number
  delta_pct: number
  reading: string
}

export type MasterPrice = {
  msrp: number | null
  observed: PriceObserved
  msrp_vs_observed: MsrpVsObserved | null
  price_tier: string | null
  min_observations_to_publish?: number
}

export type MasterDietary = {
  is_gluten_free: boolean | null
  is_vegan: boolean | null
  is_vegetarian: boolean | null
  is_organic: boolean | null
  is_non_gmo: boolean | null
  is_kosher: boolean | null
  is_halal: boolean | null
  is_keto_friendly: boolean | null
  is_paleo: boolean | null
  contains: Record<string, boolean | null>
  source_type: string | null
  evidence_rung: EvidenceRung | string | null
  computed_at: string | null
} | null

export type MasterIntelligence = {
  admin_only: boolean
  unique_raters: number
  total_battles: number | null
  min_raters_to_publish: number
  taste_score: number | null
  health_score: number | null
} | null

export type MasterCoverage = {
  active_products: number
  with_image: number
  with_nutrition: number
  with_ingredients: number
  with_allergens: number
  with_micronutrients: number
  with_dietary_flags: number
  with_facets: number
  with_price: number
  with_any_battle: number
  as_of: string
}

export type OpenCorrection = {
  id: string
  correction_type: string
  status: string
  created_at: string
  /** system_flag = classifier asked for a human; proposal = someone asserted a change */
  kind: 'system_flag' | 'proposal' | string
  review_reason: string | null
  /** Admin-only internal note; null for brands on proposals */
  system_note: string | null
  /** Server-composed; render verbatim — never parse proposed_value */
  summary: string
  current_category_name: string | null
  proposed_category_name: string | null
  other_category_description: string | null
  user_notes: string | null
  has_evidence_image: boolean
  /** Admin-only; null for brands */
  evidence_image_url: string | null
}

export type RecentChange = {
  field_name: string
  old_value: unknown
  new_value: unknown
  actor_kind: string
  actor_label: string
  actor_display_name: string | null
  evidence_rung: string | null
  changed_at: string
}

export type ProductMaster = {
  product: ProductMasterProduct
  editable_fields: string[]
  sku_count: number
  skus: MasterSku[]
  images: MasterImage[]
  compare_groups: {
    eligible: CompareGroupEligible[]
    results: CompareGroupResult[] | null
  }
  price: MasterPrice
  dietary: MasterDietary
  intelligence: MasterIntelligence
  coverage: MasterCoverage
  open_corrections: OpenCorrection[]
  recent_changes: RecentChange[]
}

export type EditableIdentityField =
  | 'product_name_display'
  | 'product_name_short'
  | 'product_flavor_variant'
  | 'product_variety'
  | 'product_description'
