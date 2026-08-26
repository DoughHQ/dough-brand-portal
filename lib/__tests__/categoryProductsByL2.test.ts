import { describe, expect, it } from 'vitest'
import { SHOW_POPULATION_ELO } from '../flags'
import {
  categoryProductSummary,
  formatLedgerComparisons,
  lockedCategoryCta,
  noProductsCategoryCopy,
  parseBrandCategoryProductsByL2,
  toCategoryProductsResult,
  toLockedCategoryProducts,
  type BrandCategoryProductRow,
} from '../categoryProductsByL2'

function row(
  partial: Partial<BrandCategoryProductRow> & Pick<BrandCategoryProductRow, 'product_id'>
): Record<string, unknown> {
  return {
    product_name_clean: `Clean ${partial.product_id}`,
    image_url: null,
    l3_node_id: 900,
    l3_name: 'Sports Drinks',
    battles_ledger: 0,
    elo_score: 1136,
    win_rate_pct: 75,
    user_percentile: 12,
    ...partial,
  }
}

describe('parseBrandCategoryProductsByL2', () => {
  it('returns empty for null or empty array', () => {
    expect(parseBrandCategoryProductsByL2(null)).toEqual([])
    expect(parseBrandCategoryProductsByL2([])).toEqual([])
  })

  it('preserves RPC order, skips invalid ids, and never invents ledger counts', () => {
    const parsed = parseBrandCategoryProductsByL2([
      row({ product_id: 3, battles_ledger: 40, product_name_clean: 'Citrus' }),
      { product_name_clean: 'No id' },
      row({ product_id: 0, battles_ledger: 9 }),
      row({ product_id: 1, battles_ledger: null as unknown as number, product_name_clean: 'Zero' }),
      row({ product_id: 2, battles_ledger: 1, product_name_clean: 'One' }),
    ])
    expect(parsed.map((p) => p.product_id)).toEqual([3, 1, 2])
    expect(parsed[0]?.battles_ledger).toBe(40)
    expect(parsed[1]?.battles_ledger).toBe(0)
    expect(parsed[1]?.product_name_clean).toBe('Zero')
    expect(parsed[2]?.battles_ledger).toBe(1)
  })

  it('does not surface battles_total_upe as the shown count', () => {
    const [parsed] = parseBrandCategoryProductsByL2([
      {
        product_id: 7,
        product_name_clean: 'Lime',
        battles_ledger: 4,
        battles_total_upe: 999,
      },
    ])
    expect(parsed?.battles_ledger).toBe(4)
    expect(parsed).not.toHaveProperty('battles_total_upe')
  })
})

describe('toCategoryProductsResult', () => {
  it('maps a supabase error to ok: false with rpc fields', () => {
    const result = toCategoryProductsResult(null, {
      code: 'PGRST202',
      message: 'Could not find the function',
      details: 'Searched without parameters',
      hint: 'Perhaps you meant get_brand_category_products',
    })
    expect(result).toEqual({
      ok: false,
      rows: [],
      error: {
        code: 'PGRST202',
        message: 'Could not find the function',
        details: 'Searched without parameters',
        hint: 'Perhaps you meant get_brand_category_products',
      },
    })
  })

  it('treats a real empty array as ok: true', () => {
    expect(toCategoryProductsResult([], null)).toEqual({ ok: true, rows: [] })
    expect(toCategoryProductsResult(null, null)).toEqual({ ok: true, rows: [] })
  })

  it('treats a non-array payload as invalid_envelope', () => {
    expect(toCategoryProductsResult({ product_id: 1 }, null)).toEqual({
      ok: false,
      rows: [],
      error: {
        code: 'invalid_envelope',
        message: 'unparseable category products payload',
        details: null,
        hint: null,
      },
    })
  })

  it('flags schema drift when a non-empty array parses to zero rows', () => {
    expect(
      toCategoryProductsResult([{ product_name_clean: 'No id' }, { product_id: 0 }], null)
    ).toEqual({
      ok: true,
      rows: [],
      allRowsUnparsed: 2,
    })
  })
})

describe('categoryProductSummary', () => {
  it('counts products, with-comparisons, and ledger sum — no ELO', () => {
    expect(
      categoryProductSummary([
        { battles_ledger: 30 },
        { battles_ledger: 0 },
        { battles_ledger: 1 },
      ])
    ).toEqual({ products: 3, withComparisons: 2, totalComparisons: 31 })
    expect(categoryProductSummary([])).toEqual({
      products: 0,
      withComparisons: 0,
      totalComparisons: 0,
    })
  })
})

describe('formatLedgerComparisons', () => {
  it('never dresses zero as a score', () => {
    expect(formatLedgerComparisons(0)).toBe('No comparisons yet')
    expect(formatLedgerComparisons(1)).toBe('1 comparison')
    expect(formatLedgerComparisons(57)).toBe('57 comparisons')
  })
})

describe('toLockedCategoryProducts', () => {
  it('omits ELO by default (flag off) and includes it only when asked', () => {
    expect(SHOW_POPULATION_ELO).toBe(false)
    const parsed = parseBrandCategoryProductsByL2([
      row({ product_id: 1, battles_ledger: 4, elo_score: 1136, win_rate_pct: 75, user_percentile: 12 }),
    ])
    const hidden = toLockedCategoryProducts(parsed)
    expect(hidden[0]?.populationElo).toBeUndefined()
    expect(hidden[0]).not.toHaveProperty('elo_score')

    const shown = toLockedCategoryProducts(parsed, { showPopulationElo: true })
    expect(shown[0]?.populationElo).toEqual({
      eloScore: 1136,
      winRatePct: 75,
      userPercentile: 12,
    })
  })

  it('keeps null elo honest when the flag is on', () => {
    const parsed = parseBrandCategoryProductsByL2([
      row({
        product_id: 2,
        battles_ledger: 0,
        elo_score: null,
        win_rate_pct: null,
        user_percentile: null,
      }),
    ])
    const shown = toLockedCategoryProducts(parsed, { showPopulationElo: true })
    expect(shown[0]?.battles_ledger).toBe(0)
    expect(shown[0]?.populationElo).toEqual({
      eloScore: null,
      winRatePct: null,
      userPercentile: null,
    })
  })
})

describe('lockedCategoryCta', () => {
  it('unlocks when the category already has signal', () => {
    expect(lockedCategoryCta(57, 'Juices & Smoothies')).toEqual({
      kind: 'unlock',
      label: 'Unlock full dashboard',
      sub: 'See the full preference breakdown for this category.',
      subject: 'Unlock full dashboard: Juices & Smoothies',
    })
  })

  it('activates when there is no signal — never Purchase now', () => {
    const cta = lockedCategoryCta(0, 'Bars & Bites')
    expect(cta).toEqual({
      kind: 'activate',
      label: 'Activate this category',
      sub: 'Put your Bars & Bites products in front of real tasters.',
      subject: 'Activate this category: Bars & Bites',
    })
    expect(JSON.stringify(cta)).not.toMatch(/purchase/i)
  })
})

describe('noProductsCategoryCopy', () => {
  it('is discovery copy with a soft talk-to-us CTA — no stats, no purchase', () => {
    const copy = noProductsCategoryCopy('Beef')
    expect(copy.line).toBe('You don’t have products in Beef yet.')
    expect(copy.sub).toBe(
      'When you do, your comparisons and category standing will show up here.'
    )
    expect(copy.cta).toEqual({
      kind: 'talk',
      label: 'Talk to us about this category',
      sub: '',
      subject: 'Talk to us about this category: Beef',
    })
    expect(JSON.stringify(copy)).not.toMatch(/purchase/i)
    expect(JSON.stringify(copy)).not.toMatch(/0 products/i)
  })
})
