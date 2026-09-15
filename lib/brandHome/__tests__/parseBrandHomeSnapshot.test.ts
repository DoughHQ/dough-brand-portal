import { describe, expect, it } from 'vitest'
import {
  parseBrandHomeSnapshot,
  parseBrandPortalChrome,
  shadowDiffBrandHome,
} from '../parseBrandHomeSnapshot'

const FIXTURE = {
  generated_at: '2026-09-14T23:00:00.000Z',
  catalog_refreshed_at: '2026-09-14T22:50:00.000Z',
  chrome: {
    brand_id: 42,
    brand_name: 'Acme',
    claimed_sku_count: 7,
    catalog_product_count: 120,
    plan: 'founder',
  },
  brand: {
    brand_id: 42,
    brand_name: 'Acme',
    brand_name_display: 'Acme',
    brand_website_url: 'https://acme.example',
    has_portal_access: true,
    logo_url: null,
    about_text: 'About',
    brand_story: null,
    headquarters_city: null,
    headquarters_state: null,
    brand_hq_country_code: null,
    founded_year: 2019,
    instagram_handle: null,
    tiktok_handle: null,
    youtube_handle: null,
    x_handle: null,
    linkedin_url: null,
    sustainability_report_url: null,
    labor_policy_url: null,
    manufacturing_locations: null,
  },
  intel: {
    elo_velocity_30d: 12,
    win_rate_30d: 0.62,
    momentum_label: 'rising',
    total_battles_30d: 40,
    total_battles_all_time: 900,
    compare_group_rank: 3,
    top_occasions: [],
  },
  pulse: {
    product_count: 120,
    battled_count: 40,
    total_battles: 900,
    open_studies: 2,
    gaining_count: 3,
    domain_verified: true,
    category_count: 5,
  },
  catalog_health: {
    total: 120,
    categories: { have: 100, total: 120 },
    images: { have: 80, total: 120 },
    pricing: { have: 60, total: 120 },
    label_allergen: { have: 10, total: 120 },
  },
  signal_cards: [
    {
      product_id: 1,
      name: 'Bar',
      category: 'Bars',
      image_url: 'https://cdn.example/bar.jpg',
      comparison_events: 12,
      standing_unlocked: true,
      standing_rank_label: '#2 of 18 in Bars',
      standing_tooltip: 'See where Bar ranks among Bars tasters once enough people have compared it.',
    },
  ],
  categories_top: [
    {
      l2_node_id: 9,
      name: 'Snack bars',
      products_with_battles: 8,
      unlocked: true,
      banner_image_url: null,
    },
  ],
  l2_node_ids: [9, 11, 12],
  studies: {
    open_count: 2,
    highlight: {
      id: 'm1',
      title: 'Pack test',
      kind: 'stuck',
      detail: 'Live with no claims',
      mission_type: 'concept_test',
      lifecycle_state: 'active',
      completed_claims: 0,
      total_claims: 0,
      target_completions: 100,
    },
  },
  parent_display_name: null,
  pending_ownership: false,
}

describe('parseBrandPortalChrome', () => {
  it('maps chrome document', () => {
    const chrome = parseBrandPortalChrome(FIXTURE.chrome)
    expect(chrome?.brandName).toBe('Acme')
    expect(chrome?.claimedSkuCount).toBe(7)
    expect(chrome?.catalogProductCount).toBe(120)
  })
})

describe('parseBrandHomeSnapshot', () => {
  it('defaults catalogReady to false when absent', () => {
    const doc = parseBrandHomeSnapshot(FIXTURE)
    expect(doc?.catalogReady).toBe(false)
  })

  it('reads catalogReady when true', () => {
    const doc = parseBrandHomeSnapshot({ ...FIXTURE, catalog_ready: true })
    expect(doc?.catalogReady).toBe(true)
  })

  it('builds complete single-RPC home document', () => {
    const doc = parseBrandHomeSnapshot(FIXTURE)
    expect(doc?.pulse.productCount).toBe(120)
    expect(doc?.catalogHealth.images.have).toBe(80)
    expect(doc?.signalCards).toHaveLength(1)
    expect(doc?.signalCards[0].href).toBe('/products/1')
    expect(doc?.signalCards[0].standing.unlocked).toBe(true)
    expect(doc?.signalCards[0].standing.rankLabel).toBe('#2 of 18 in Bars')
    expect(doc?.homeModel.openStudiesCount).toBe(2)
    expect(doc?.homeModel.studies[0]?.href).toContain('/studies/concept/m1')
    expect(doc?.categoriesTop[0]?.unlocked).toBe(true)
    expect(doc?.brand.brand_name).toBe('Acme')
    expect(doc?.narrative.headline.length).toBeGreaterThan(0)
    expect(doc?.l2NodeIds).toEqual([9, 11, 12])
    expect(doc?.snapshot?.elo_velocity_30d).toBe(12)
  })

  it('rejects documents without brand stub', () => {
    const { brand: _b, ...rest } = FIXTURE
    expect(parseBrandHomeSnapshot(rest)).toBeNull()
  })
})

describe('shadowDiffBrandHome', () => {
  it('reports cardinality mismatches', () => {
    const doc = parseBrandHomeSnapshot(FIXTURE)!
    const diffs = shadowDiffBrandHome(doc, {
      productCount: 119,
      openStudies: 2,
      battled: 40,
      gaining: 3,
    })
    expect(diffs.some((d) => d.startsWith('product_count'))).toBe(true)
  })
})
