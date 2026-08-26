/**
 * App-wide feature flags.
 *
 * SHOW_POPULATION_ELO is n=1 user_product_elo from get_brand_products_portfolio —
 * not population data. Must stay false until a real aggregated signal exists.
 *
 * SHOW_BRAND_VERIFICATION_FLOW gates initiate/complete/SKU-confirm UI. Must stay
 * false until the proof-of-ownership step ships — complete_brand_claim fails
 * closed with proof_not_completed until then.
 */
export const SHOW_POPULATION_ELO = false

export const SHOW_BRAND_VERIFICATION_FLOW = false
