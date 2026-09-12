import { describe, expect, it } from 'vitest'
import {
  messageFromCapabilityReason,
  messageFromDistributionError,
} from '@/lib/distribution/errors'
import { parseCoord, serializeCoord, coordsEqual } from '@/lib/distribution/coords'
import {
  actionsForState,
  claimLabel,
  claimLabelLong,
  confirmLabel,
  shopperLine,
  shopperDatesLine,
  shortVariantLabel,
  formatCalendarDate,
} from '@/lib/distribution/actions'
import {
  claimableSeedRows,
  groupDistributionByBanner,
  hasSiblingDoughSeed,
  packConflict,
  partitionDistribution,
  reportsForCoord,
  seedPeekNames,
  shouldShowBannerFilter,
} from '@/lib/distribution/grouping'
import type { AvailabilityReport, DistributionRow } from '@/lib/distribution/grouping'

function row(
  partial: Partial<DistributionRow> & Pick<DistributionRow, 'retailer_id' | 'retailer_name'>,
): DistributionRow {
  return {
    parent_name: null,
    retailer_type: 'grocery',
    scope_level: 'region',
    geo_region_id: 1,
    retail_location_id: null,
    scope_label: 'Maryland',
    sku_variant_id: null,
    variant_label: 'All pack sizes',
    declaration_id: null,
    brand_status: null,
    brand_declared_at: null,
    brand_delisted_on: null,
    dough_seeded: false,
    seed_evidence_url: null,
    seed_found_at: null,
    shopper_reports: 0,
    last_reported_on: null,
    shopper_signal_stale: false,
    awaiting_review: 0,
    needs_attention: false,
    covered_by_national: false,
    national_declaration_id: null,
    ...partial,
  }
}

describe('distribution errors', () => {
  it('maps ownership and review HINTs', () => {
    expect(
      messageFromDistributionError({ hint: 'PRODUCT_BRAND_ATTRIBUTION_UNRESOLVED' }),
    ).toMatch(/confirm who owns/i)
    expect(messageFromDistributionError({ hint: 'REVIEW_NEEDS_REASON' })).toMatch(/short note/i)
    expect(messageFromDistributionError({ hint: 'NO_PENDING_REPORTS' })).toMatch(/waiting/i)
    expect(messageFromCapabilityReason('NOT_A_BRAND_PORTAL_USER')).toMatch(/linked to a brand/i)
  })

  it('never surfaces postgres strings for unmapped errors', () => {
    expect(
      messageFromDistributionError({
        message: 'relation "product_availability" does not exist',
        hint: null,
      }),
    ).toBe('Something went wrong. Try again.')
  })

  it('does not contain the word verified', () => {
    const blob = Object.values({
      a: messageFromDistributionError({ hint: 'CROSS_TENANT_ACCESS_DENIED' }),
      b: claimLabel(),
      c: claimLabelLong(),
      d: confirmLabel(false, null),
    })
      .join(' ')
      .toLowerCase()
    expect(blob).not.toContain('verified')
  })
})

describe('coords', () => {
  it('round-trips nationwide nulls', () => {
    const c = {
      retailer_id: 12,
      scope_level: 'national',
      geo_region_id: null,
      retail_location_id: null,
      sku_variant_id: null,
    }
    const s = serializeCoord(c)
    expect(s).toBe('12|national|n|n|n')
    expect(parseCoord(s)).toEqual(c)
    expect(coordsEqual(parseCoord(s)!, c)).toBe(true)
  })

  it('round-trips regional variant keys', () => {
    const c = {
      retailer_id: 7,
      scope_level: 'region',
      geo_region_id: 88,
      retail_location_id: null,
      sku_variant_id: 303,
    }
    expect(parseCoord(serializeCoord(c))).toEqual(c)
  })
})

describe('actions matrix', () => {
  it('uses claim not confirm for seed-only rows', () => {
    expect(actionsForState(null, 0)).toEqual(['claim'])
    expect(claimLabel()).toMatch(/Claim this/)
    expect(claimLabelLong()).toMatch(/Add this to your distribution/)
  })

  it('composes pending + active', () => {
    expect(actionsForState('active', 2)).toEqual([
      'confirm',
      'correct',
      'dispute',
      'withdraw',
      'delist',
    ])
  })

  it('composes delisted + pending', () => {
    expect(actionsForState('delisted', 1)).toEqual([
      'confirm',
      'correct',
      'dispute',
      'redeclare',
    ])
  })
})

describe('copy', () => {
  it('singular and plural shopper lines', () => {
    expect(shopperLine(1, '2026-07-04')).toBe(
      '1 shopper reported this · most recently 4 Jul 2026',
    )
    expect(shopperLine(6, '2026-07-04')).toBe(
      '6 shoppers reported this · most recently 4 Jul 2026',
    )
  })

  it('formats evidence dates without timezone shift', () => {
    expect(formatCalendarDate('2026-03-15')).toBe('15 Mar 2026')
    expect(shopperDatesLine(['2026-09-11', '2026-09-07', '2026-08-31'])).toBe(
      'Sighted 11 Sep 2026, 7 Sep 2026, 31 Aug 2026',
    )
  })

  it('shortens variant labels by stripping product title', () => {
    expect(
      shortVariantLabel(
        'Gatorade Lemon Lime Thirst Quencher 28 Fluid Ounce Bottle',
        'Gatorade Lemon Lime Thirst Quencher',
      ),
    ).toBe('28 Fluid Ounce Bottle')
    expect(shortVariantLabel('All pack sizes')).toBe('All pack sizes')
    expect(shortVariantLabel('Pack size not recorded')).toBe('Pack size not recorded')
  })
})

describe('grouping & sections', () => {
  it('floats attention banners and merges quiet rows into the same group', () => {
    const rows = [
      row({
        retailer_id: 2,
        retailer_name: 'Wegmans',
        needs_attention: false,
        awaiting_review: 0,
      }),
      row({
        retailer_id: 1,
        retailer_name: 'Harris Teeter',
        needs_attention: true,
        awaiting_review: 3,
        geo_region_id: 10,
      }),
      row({
        retailer_id: 1,
        retailer_name: 'Harris Teeter',
        needs_attention: false,
        awaiting_review: 0,
        geo_region_id: 11,
        scope_label: 'Virginia',
      }),
    ]
    const groups = groupDistributionByBanner(rows)
    expect(groups.map((g) => g.retailer_name)).toEqual(['Harris Teeter', 'Wegmans'])
    expect(groups[0]!.rows).toHaveLength(2)
    expect(groups[0]!.needsAttention).toBe(true)
  })

  it('partitions exclusively: attention beats dough seed', () => {
    const rows = [
      row({
        retailer_id: 1,
        retailer_name: 'Harris Teeter',
        needs_attention: true,
        awaiting_review: 3,
        dough_seeded: false,
        sku_variant_id: 9,
        variant_label: '28 fl oz',
      }),
      row({
        retailer_id: 2,
        retailer_name: 'Wegmans',
        needs_attention: true,
        awaiting_review: 1,
        dough_seeded: false,
        sku_variant_id: 9,
      }),
      row({
        retailer_id: 2,
        retailer_name: 'Wegmans',
        needs_attention: false,
        dough_seeded: true,
        geo_region_id: 1,
      }),
      row({
        retailer_id: 3,
        retailer_name: 'Giant Food',
        brand_status: 'active',
        declaration_id: 1,
      }),
      row({
        retailer_id: 4,
        retailer_name: 'Walmart',
        dough_seeded: true,
        scope_level: 'national',
        geo_region_id: null,
        scope_label: 'nationwide',
      }),
    ]
    const sections = partitionDistribution(rows)
    expect(sections.map((s) => [s.id, s.rows.length])).toEqual([
      ['needs_review', 2],
      ['yours', 1],
      ['dough_seeds', 2],
    ])
    expect(sections[0]!.rows.every((r) => r.needs_attention)).toBe(true)
    expect(claimableSeedRows(sections[2]!.rows)).toHaveLength(2)
    expect(hasSiblingDoughSeed(rows, rows[1]!)).toBe(true)
  })

  it('joins pending reports by 5-tuple for evidence dates only', () => {
    const dist = row({
      retailer_id: 1,
      retailer_name: 'Harris Teeter',
      geo_region_id: 10,
      sku_variant_id: 40167445,
      awaiting_review: 3,
      variant_label: '28 Fluid Ounce Bottle',
    })
    const reports: AvailabilityReport[] = [
      {
        report_id: 101,
        retailer_id: 1,
        retailer_name: 'Harris Teeter',
        parent_name: null,
        scope_level: 'region',
        geo_region_id: 10,
        retail_location_id: null,
        scope_label: 'Maryland',
        sku_variant_id: 40167445,
        variant_label: '28 Fluid Ounce Bottle',
        report_date: '2026-07-01',
        review_state: 'published',
        contradicts_delisting: false,
      },
      {
        report_id: 102,
        retailer_id: 1,
        retailer_name: 'Harris Teeter',
        parent_name: null,
        scope_level: 'region',
        geo_region_id: 10,
        retail_location_id: null,
        scope_label: 'Maryland',
        sku_variant_id: 40167445,
        variant_label: '28 Fluid Ounce Bottle',
        report_date: '2026-07-02',
        review_state: 'published',
        contradicts_delisting: false,
      },
      {
        report_id: 999,
        retailer_id: 1,
        retailer_name: 'Harris Teeter',
        parent_name: null,
        scope_level: 'region',
        geo_region_id: 99,
        retail_location_id: null,
        scope_label: 'Virginia',
        sku_variant_id: 40167445,
        variant_label: '28 Fluid Ounce Bottle',
        report_date: '2026-07-03',
        review_state: 'published',
        contradicts_delisting: false,
      },
    ]
    expect(reportsForCoord(reports, dist).map((r) => r.report_id)).toEqual([101, 102])
    expect(packConflict(reportsForCoord(reports, dist))).toBe(false)
  })

  it('detects pack conflicts across pending reports', () => {
    expect(
      packConflict([
        {
          report_id: 1,
          retailer_id: 1,
          retailer_name: 'X',
          parent_name: null,
          scope_level: 'region',
          geo_region_id: 1,
          retail_location_id: null,
          scope_label: 'MD',
          sku_variant_id: 1,
          variant_label: '12 oz',
          report_date: '2026-01-01',
          review_state: 'published',
          contradicts_delisting: false,
        },
        {
          report_id: 2,
          retailer_id: 1,
          retailer_name: 'X',
          parent_name: null,
          scope_level: 'region',
          geo_region_id: 1,
          retail_location_id: null,
          scope_label: 'MD',
          sku_variant_id: 2,
          variant_label: '28 oz',
          report_date: '2026-01-02',
          review_state: 'published',
          contradicts_delisting: false,
        },
      ]),
    ).toBe(true)
  })

  it('shows banner filter above 10 coordinates and peeks seed names', () => {
    expect(shouldShowBannerFilter(10)).toBe(false)
    expect(shouldShowBannerFilter(11)).toBe(true)
    const peek = seedPeekNames(
      [
        row({ retailer_id: 1, retailer_name: 'Walmart', dough_seeded: true }),
        row({ retailer_id: 2, retailer_name: 'Target', dough_seeded: true }),
        row({ retailer_id: 3, retailer_name: 'Costco', dough_seeded: true }),
        row({ retailer_id: 4, retailer_name: 'CVS', dough_seeded: true }),
      ],
      3,
    )
    expect(peek.names).toEqual(['Walmart', 'Target', 'Costco'])
    expect(peek.remaining).toBe(1)
  })
})
