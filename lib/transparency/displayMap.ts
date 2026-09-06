/**
 * Display labels for proof/disclosure snake_case codes.
 * Keep identical to dough_app/src/lib/transparency/displayMap.ts
 */

const PROOF_CODE_LABELS: Record<string, string> = {
  // Packaging materials
  PET1: 'PET (#1)',
  HDPE2: 'HDPE (#2)',
  PVC3: 'PVC (#3)',
  LDPE4: 'LDPE (#4)',
  PP5: 'PP (#5)',
  PS6: 'PS (#6)',
  other_plastic7: 'Other plastic (#7)',
  glass: 'Glass',
  aluminum: 'Aluminum',
  steel: 'Steel',
  paperboard: 'Paperboard',
  molded_fiber: 'Molded fiber',
  multilayer_composite: 'Multilayer composite',
  bioplastic: 'Bioplastic',

  // Disposal / reuse
  curbside_recyclable: 'Curbside recyclable',
  store_dropoff: 'Store drop-off',
  industrially_compostable: 'Industrially compostable',
  home_compostable: 'Home compostable',
  landfill: 'Landfill',
  varies_by_locality: 'Varies by locality',
  refill_at_home: 'Refill at home',
  refill_on_the_go: 'Refill on the go',
  return_from_home: 'Return from home',
  return_on_the_go: 'Return on the go',

  // Carbon / footprint
  cradle_to_gate: 'Cradle-to-gate',
  cradle_to_shelf: 'Cradle-to-shelf',
  cradle_to_grave: 'Cradle-to-grave',
  gate_to_gate: 'Gate-to-gate',
  primary_data: 'Primary data',
  hybrid: 'Hybrid',
  secondary_database: 'Secondary database',
  screening_estimate: 'Screening estimate',
  ISO_14067: 'ISO 14067',
  GHG_Protocol_Product_Standard: 'GHG Protocol Product Standard',
  PAS_2050: 'PAS 2050',
  EU_PEF: 'EU PEF',
  EPD_ISO_14025: 'EPD (ISO 14025)',
  kgCO2e_per_kg: 'kgCO₂e per kg',
  kgCO2e_per_serving: 'kgCO₂e per serving',
  kgCO2e_per_pack: 'kgCO₂e per pack',
  kgCO2e_per_litre: 'kgCO₂e per litre',
  tCO2e_per_revenue_million: 'tCO₂e per $M revenue',
  tCO2e_total: 'tCO₂e total',
  self_reported: 'Self-reported',
  critically_reviewed: 'Critically reviewed',
  limited_assurance: 'Limited assurance',
  reasonable_assurance: 'Reasonable assurance',
  third_party_verified: 'Third-party verified',
  product_lca_cradle_to_gate: 'Product LCA cradle-to-gate',
  product_lca_cradle_to_grave: 'Product LCA cradle-to-grave',
  scope_1: 'Scope 1',
  scope_1_2: 'Scope 1 & 2',
  scope_1_2_3: 'Scope 1, 2 & 3',

  // Animal welfare
  GAP_step_1: 'GAP step 1',
  GAP_step_2: 'GAP step 2',
  GAP_step_3: 'GAP step 3',
  GAP_step_4: 'GAP step 4',
  GAP_step_5: 'GAP step 5',
  GAP_step_5_plus: 'GAP step 5+',
  Certified_Humane: 'Certified Humane',
  Animal_Welfare_Approved: 'Animal Welfare Approved',
  RSPCA_Assured: 'RSPCA Assured',
  organic: 'Organic',
  own_standard: 'Own standard',
  no_antibiotics_ever: 'No antibiotics ever',
  no_medically_important_antibiotics: 'No medically important antibiotics',
  therapeutic_use_only: 'Therapeutic use only',
  no_added_hormones: 'No added hormones',

  // Origin
  country: 'Country',
  region: 'Region',
  locality: 'Locality',
  plot: 'Plot',
  ISO_3166_1_alpha_2: 'ISO 3166-1 alpha-2',

  // Supply chain (FSMA)
  harvesting: 'Harvesting',
  cooling: 'Cooling',
  initial_packing: 'Initial packing',
  first_land_based_receiving: 'First land-based receiving',
  shipping: 'Shipping',
  receiving: 'Receiving',
  transformation: 'Transformation',

  // Process / treatments
  hpp: 'HPP',
  htst: 'HTST',
  uht: 'UHT',
  vat: 'Vat pasteurized',
  raw_unpasteurized: 'Raw / unpasteurized',
  irradiated: 'Irradiated',
  cold_pressed: 'Cold-pressed',
  virgin: 'Virgin',
  refined: 'Refined',
  crude: 'Crude',
  nixtamalized: 'Nixtamalized',
  air_dried: 'Air-dried',
  smoked: 'Smoked',
  fermented: 'Fermented',
  alkalized: 'Alkalized',
  bleached: 'Bleached',
  bromated: 'Bromated',
  deodorized: 'Deodorized',
  enriched: 'Enriched',
  fortified: 'Fortified',
  flash_frozen: 'Flash-frozen',
  kettle_cooked: 'Kettle-cooked',
  slow_roasted: 'Slow-roasted',
  stone_ground: 'Stone-ground',
  sprouted: 'Sprouted',
  hydrogenated: 'Hydrogenated',
  interesterified: 'Interesterified',

  // Storage
  ambient: 'Ambient',
  cool_and_dry: 'Cool and dry',
  refrigerated: 'Refrigerated',
  frozen: 'Frozen',
  controlled_atmosphere: 'Controlled atmosphere',
  best_by_quality: 'Best by (quality)',
  use_by_safety: 'Use by (safety)',
  sell_by: 'Sell by',
  freeze_by: 'Freeze by',

  // Labor / social / certifications
  SA8000: 'SA8000',
  RSPO: 'RSPO',
  RTRS: 'RTRS',
  FSC: 'FSC',
  PEFC: 'PEFC',
  B_Corp: 'B Corp',
  Fairtrade: 'Fairtrade',
  Fair_Trade_USA: 'Fair Trade USA',
  Fair_for_Life: 'Fair for Life',
  Fair_Labor_Association: 'Fair Labor Association',
  Rainforest_Alliance: 'Rainforest Alliance',
  Equitable_Food_Initiative: 'Equitable Food Initiative',
  ETI_Base_Code: 'ETI Base Code',
  amfori_BSCI: 'amfori BSCI',
  SMETA_2_pillar: 'SMETA 2-pillar',
  SMETA_4_pillar: 'SMETA 4-pillar',
  ProTerra: 'ProTerra',
  Cocoa_Horizons: 'Cocoa Horizons',
  non_gmo_verified: 'Non-GMO verified',

  // Chain of custody / sourcing
  identity_preserved: 'Identity preserved',
  segregated: 'Segregated',
  mass_balance: 'Mass balance',
  book_and_claim: 'Book and claim',
  ndpe: 'NDPE',
  organic_only: 'Organic only',
  farm_level: 'Farm level',
  full_supply_chain: 'Full supply chain',
  processing_only: 'Processing only',
  own_operations: 'Own operations',
  tier_1_suppliers: 'Tier 1 suppliers',
  tier_1_facilities: 'Tier 1 facilities',
  tier_1_and_tier_2: 'Tier 1 and tier 2',
  beyond_tier_2: 'Beyond tier 2',
  cutoff_2015: 'Cutoff 2015',
  cutoff_2020: 'Cutoff 2020',

  // Land / soil / water practices
  no_till: 'No-till',
  reduced_till: 'Reduced till',
  cover_crop: 'Cover crop',
  alley_cropping: 'Alley cropping',
  conservation_cover: 'Conservation cover',
  conservation_crop_rotation: 'Conservation crop rotation',
  contour_buffer_strips: 'Contour buffer strips',
  grazing_management: 'Grazing management',
  silvopasture: 'Silvopasture',
  soil_carbon_amendment: 'Soil carbon amendment',
  riparian_buffer: 'Riparian buffer',
  integrated_pest_management: 'Integrated pest management',
  restricted_pesticide_list: 'Restricted pesticide list',
  no_synthetic_fertilizer: 'No synthetic fertilizer',
  sustainable_water_balance: 'Sustainable water balance',
  good_water_quality_status: 'Good water quality status',
  good_water_governance: 'Good water governance',
  important_water_related_areas: 'Important water-related areas',
  wash_access: 'Wash access',

  // Energy / waste hierarchy
  self_generation: 'Self-generation',
  unbundled_eacs: 'Unbundled EACs',
  supplier_contract_green_tariff: 'Supplier contract / green tariff',
  direct_procurement_ppa: 'Direct procurement (PPA)',
  default_delivered: 'Default delivered',
  source_reduction_and_reuse: 'Source reduction and reuse',
  recycling_and_composting: 'Recycling and composting',
  energy_recovery: 'Energy recovery',
  treatment_and_disposal: 'Treatment and disposal',

  // Human rights diligence verbs
  identify_and_assess: 'Identify and assess',
  prevent_and_mitigate: 'Prevent and mitigate',
  track_implementation: 'Track implementation',
  communicate: 'Communicate',
  provide_remediation: 'Provide remediation',
  embed_policy: 'Embed policy',
  own_code_of_conduct: 'Own code of conduct',

  percent: '%',
  other: 'Other',
}

const COUNTRY_DISPLAY =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

/** Format a registry / disclosure code for shoppers and brands. */
export function formatProofCode(code: string | null | undefined): string {
  if (code == null || code === '') return ''
  const mapped = PROOF_CODE_LABELS[code]
  if (mapped) return mapped

  // ISO country codes (origin_country)
  if (/^[A-Z]{2}$/.test(code)) {
    try {
      const name = COUNTRY_DISPLAY?.of(code)
      if (name && name !== code) return name
    } catch {
      /* ignore */
    }
    return code
  }

  return code
    .replace(/_/g, ' ')
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
}

export function formatUnitSuffix(unit: string | null | undefined): string {
  if (!unit) return ''
  if (unit === 'percent') return '%'
  return formatProofCode(unit)
}
