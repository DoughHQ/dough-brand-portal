import type {
  AvailabilityReport,
  DistributionRow,
} from '@/lib/distribution/grouping'

export function row(
  patch: Partial<DistributionRow> = {},
): DistributionRow {
  return {
    retailer_id: 7,
    retailer_name: 'Market Basket',
    parent_name: null,
    retailer_type: 'grocery',
    scope_level: 'region',
    geo_region_id: 11,
    retail_location_id: null,
    scope_label: 'Massachusetts',
    sku_variant_id: null,
    variant_label: 'All pack sizes',
    declaration_id: null,
    brand_status: null,
    brand_declared_at: null,
    brand_delisted_on: null,
    dough_seeded: true,
    seed_evidence_url: null,
    seed_found_at: '2026-10-01T12:00:00Z',
    shopper_reports: 0,
    last_reported_on: null,
    shopper_signal_stale: false,
    awaiting_review: 0,
    needs_attention: false,
    covered_by_national: false,
    national_declaration_id: null,
    ...patch,
  }
}

export function report(
  patch: Partial<AvailabilityReport> = {},
): AvailabilityReport {
  return {
    report_id: 91,
    retailer_id: 7,
    retailer_name: 'Market Basket',
    parent_name: null,
    scope_level: 'region',
    geo_region_id: 11,
    retail_location_id: null,
    scope_label: 'Massachusetts',
    sku_variant_id: null,
    variant_label: 'All pack sizes',
    report_date: '2026-10-02',
    review_state: 'pending',
    contradicts_delisting: false,
    ...patch,
  }
}
