/**
 * App-wide feature flags.
 *
 * SHOW_POPULATION_ELO is n=1 user_product_elo from get_brand_products_portfolio —
 * not population data. Must stay false until a real aggregated signal exists.
 *
 * SHOW_BRAND_VERIFICATION_FLOW gates initiate/complete/SKU-confirm UI. Must stay
 * false until the proof-of-ownership step ships — complete_brand_claim fails
 * closed with proof_not_completed until then.
 *
 * DOUGH_BRAND_HOME_SNAPSHOT (server env):
 *   on  — serve get_brand_home_snapshot (default)
 *   off — fail closed (BrandHomeUnavailable). Legacy fan-out deleted.
 *   shadow — treated as on (shadow path removed)
 *
 * DOUGH_BRAND_PRODUCTS_PAGE (server env):
 *   on  — list_brand_products_page (≤50 keyset); default
 *   off — reserved kill-switch (not wired; page always uses keyset path)
 */
export const SHOW_POPULATION_ELO = false

export const SHOW_BRAND_VERIFICATION_FLOW = false

export type BrandHomeSnapshotMode = 'on' | 'off'

export function brandHomeSnapshotMode(): BrandHomeSnapshotMode {
  const raw = (process.env.DOUGH_BRAND_HOME_SNAPSHOT ?? 'on').trim().toLowerCase()
  if (raw === 'off' || raw === '0' || raw === 'false') return 'off'
  return 'on'
}

export function brandProductsPageEnabled(): boolean {
  const raw = (process.env.DOUGH_BRAND_PRODUCTS_PAGE ?? 'on').trim().toLowerCase()
  return !(raw === 'off' || raw === '0' || raw === 'false')
}
