import { describe, expect, it } from 'vitest'
import {
  askedWhen,
  parseBrandProofAskCounts,
  planetDemandCopy,
  proofTabAskAria,
  proofTabAskBadge,
  selectPcfAsk,
} from '../proofAskCounts'

const NOW = Date.parse('2026-09-14T22:00:00Z')

describe('parseBrandProofAskCounts', () => {
  it('reads the live table contract', () => {
    const rows = parseBrandProofAskCounts([
      {
        sub_metric_code: 'product_carbon_footprint',
        label: 'Product carbon footprint',
        pillar: 'planet',
        product_ask_count: 1,
        brand_ask_count: 1,
        first_asked_at: '2026-09-14T21:00:00Z',
        last_asked_at: '2026-09-14T21:00:00Z',
      },
    ])
    expect(selectPcfAsk(rows)).toMatchObject({
      subMetricCode: 'product_carbon_footprint',
      productAskCount: 1,
      brandAskCount: 1,
    })
  })

  it('reads a legacy ask_count as this product’s count', () => {
    const rows = parseBrandProofAskCounts([
      { sub_metric_code: 'product_carbon_footprint', ask_count: 3 },
    ])
    expect(selectPcfAsk(rows)?.productAskCount).toBe(3)
  })

  it('does not invent rows from empty payloads', () => {
    expect(parseBrandProofAskCounts(null)).toEqual([])
    expect(parseBrandProofAskCounts([])).toEqual([])
    expect(selectPcfAsk([])).toBeNull()
  })
})

describe('proofTabAskBadge', () => {
  it('badges this SKU only — catalog demand is not a Cheez-It count', () => {
    expect(proofTabAskBadge(null)).toBe(0)
    expect(
      proofTabAskBadge({
        subMetricCode: 'product_carbon_footprint',
        label: null,
        pillar: 'planet',
        productAskCount: 0,
        brandAskCount: 12,
        firstAskedAt: null,
        lastAskedAt: null,
      }),
    ).toBe(0)
    expect(
      proofTabAskBadge({
        subMetricCode: 'product_carbon_footprint',
        label: null,
        pillar: 'planet',
        productAskCount: 1,
        brandAskCount: 12,
        firstAskedAt: null,
        lastAskedAt: null,
      }),
    ).toBe(1)
  })

  it('names the ask in the tab aria', () => {
    expect(proofTabAskAria(0)).toBe('P.R.O.O.F.')
    expect(proofTabAskAria(1)).toBe('P.R.O.O.F., 1 shopper asked')
    expect(proofTabAskAria(12)).toBe('P.R.O.O.F., 12 shoppers asked')
  })
})

describe('planetDemandCopy', () => {
  it('stays quiet at zero', () => {
    expect(
      planetDemandCopy({
        productAskCount: 0,
        brandAskCount: 0,
        lastAskedAt: null,
        published: false,
      }),
    ).toBeNull()
  })

  it('makes one ask on this SKU a demand object, not a footnote', () => {
    const copy = planetDemandCopy({
      productAskCount: 1,
      brandAskCount: 1,
      lastAskedAt: '2026-09-14T21:10:00Z',
      published: false,
      now: NOW,
    })
    expect(copy?.tone).toBe('product')
    expect(copy?.count).toBe(1)
    expect(copy?.kicker).toBe('Shoppers asked')
    expect(copy?.countNoun).toBe(
      'shopper asked for this product’s carbon footprint.',
    )
    expect(copy?.shopperSees).toBe('No published carbon footprint.')
    expect(copy?.closeLine).toMatch(/fields below/)
    expect(copy?.closeLine).not.toMatch(/filter/i)
    expect(copy?.closeLine).not.toMatch(/request data/i)
    expect(copy?.recencyLine).toBe('Last asked today')
    expect(copy?.catalogLine).toBeNull()
  })

  it('does not claim this SKU when only the catalog has asks', () => {
    const copy = planetDemandCopy({
      productAskCount: 0,
      brandAskCount: 12,
      lastAskedAt: '2026-09-13T12:00:00Z',
      published: false,
      now: NOW,
    })
    expect(copy?.tone).toBe('catalog')
    expect(copy?.count).toBe(12)
    expect(copy?.countNoun).toMatch(/other products/)
    expect(copy?.shopperSees).toBe('No published carbon footprint.')
    expect(copy?.recencyLine).toBe('Last asked yesterday')
  })

  it('keeps the count after publish — the ask is not deleted', () => {
    const copy = planetDemandCopy({
      productAskCount: 4,
      brandAskCount: 4,
      lastAskedAt: null,
      published: true,
    })
    expect(copy?.tone).toBe('answered')
    expect(copy?.count).toBe(4)
    expect(copy?.shopperSees).toBeNull()
    expect(copy?.closeLine).toMatch(/stays on the record/)
  })

  it('names catalog pressure only when brand > product', () => {
    const copy = planetDemandCopy({
      productAskCount: 1,
      brandAskCount: 12,
      lastAskedAt: null,
      published: false,
    })
    expect(copy?.catalogLine).toBe('12 shoppers asked across your catalog.')
  })
})

describe('askedWhen', () => {
  it('does not invent a date from noise', () => {
    expect(askedWhen(null, NOW)).toBeNull()
    expect(askedWhen('nope', NOW)).toBeNull()
  })
})
