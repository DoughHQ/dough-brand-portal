import type { DistributionCoord } from './coords'
import { coordsEqual, coordFromRow } from './coords'

export type DistributionRow = {
  retailer_id: number
  retailer_name: string
  parent_name: string | null
  retailer_type: string | null
  scope_level: string
  geo_region_id: number | null
  retail_location_id: number | null
  scope_label: string
  sku_variant_id: number | null
  variant_label: string
  declaration_id: number | null
  brand_status: string | null
  brand_declared_at: string | null
  brand_delisted_on: string | null
  dough_seeded: boolean
  seed_evidence_url: string | null
  seed_found_at: string | null
  shopper_reports: number
  last_reported_on: string | null
  shopper_signal_stale: boolean
  awaiting_review: number
  needs_attention: boolean
  covered_by_national: boolean
  national_declaration_id: number | null
}

export type AvailabilityReport = {
  report_id: number
  retailer_id: number
  retailer_name: string
  parent_name: string | null
  scope_level: string
  geo_region_id: number | null
  retail_location_id: number | null
  scope_label: string
  sku_variant_id: number | null
  variant_label: string
  report_date: string
  review_state: string
  contradicts_delisting: boolean
}

export type BannerGroup = {
  retailer_id: number
  retailer_name: string
  parent_name: string | null
  needsAttention: boolean
  rows: DistributionRow[]
}

/**
 * Group by banner. Sort groups by any needs_attention, then banner name.
 * Preserve relative order of rows inside a group (RPC already sorts attention first).
 */
export function groupDistributionByBanner(rows: DistributionRow[]): BannerGroup[] {
  const order: number[] = []
  const map = new Map<number, BannerGroup>()

  for (const row of rows) {
    let g = map.get(row.retailer_id)
    if (!g) {
      g = {
        retailer_id: row.retailer_id,
        retailer_name: row.retailer_name,
        parent_name: row.parent_name,
        needsAttention: false,
        rows: [],
      }
      map.set(row.retailer_id, g)
      order.push(row.retailer_id)
    }
    g.rows.push(row)
    if (row.needs_attention) g.needsAttention = true
  }

  const groups = order.map((id) => map.get(id)!)
  groups.sort((a, b) => {
    if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1
    return a.retailer_name.localeCompare(b.retailer_name)
  })
  return groups
}

export function reportsForCoord(
  reports: AvailabilityReport[],
  row: DistributionRow,
): AvailabilityReport[] {
  const key = coordFromRow(row)
  return reports.filter((r) =>
    coordsEqual(key, {
      retailer_id: r.retailer_id,
      scope_level: r.scope_level,
      geo_region_id: r.geo_region_id,
      retail_location_id: r.retail_location_id,
      sku_variant_id: r.sku_variant_id,
    }),
  )
}

export function findRowByCoord(
  rows: DistributionRow[],
  coord: DistributionCoord,
): DistributionRow | null {
  return rows.find((r) => coordsEqual(coordFromRow(r), coord)) ?? null
}
