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

export type DistributionSectionId = 'needs_review' | 'yours' | 'dough_seeds'

export type DistributionSection = {
  id: DistributionSectionId
  title: string
  rows: DistributionRow[]
  /** Banner groups within this section (RPC order preserved inside). */
  groups: BannerGroup[]
}

const BANNER_FILTER_THRESHOLD = 10

/**
 * Exclusive partition with priority:
 * 1. Needs review if needs_attention
 * 2. Else Your distribution if brand active/delisted
 * 3. Else Also found by Dough (unclaimed seeds)
 *
 * Rows that match none (shouldn't happen) fall into yours if branded else seeds.
 */
export function partitionDistribution(rows: DistributionRow[]): DistributionSection[] {
  const needs: DistributionRow[] = []
  const yours: DistributionRow[] = []
  const seeds: DistributionRow[] = []

  for (const row of rows) {
    if (row.needs_attention) {
      needs.push(row)
      continue
    }
    if (row.brand_status === 'active' || row.brand_status === 'delisted') {
      yours.push(row)
      continue
    }
    seeds.push(row)
  }

  return [
    {
      id: 'needs_review',
      title: 'Needs your review',
      rows: needs,
      groups: groupDistributionByBanner(needs),
    },
    {
      id: 'yours',
      title: 'Your distribution',
      rows: yours,
      groups: groupDistributionByBanner(yours),
    },
    {
      id: 'dough_seeds',
      title: 'Also found by Dough',
      rows: seeds,
      groups: groupDistributionByBanner(seeds),
    },
  ]
}

export function claimableSeedRows(rows: DistributionRow[]): DistributionRow[] {
  return rows.filter(
    (r) =>
      r.dough_seeded &&
      r.brand_status == null &&
      r.awaiting_review === 0 &&
      !r.needs_attention,
  )
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

/** Dough seed at same banner × region (any variant) — weak corroboration signal. */
export function hasSiblingDoughSeed(allRows: DistributionRow[], row: DistributionRow): boolean {
  return allRows.some(
    (r) =>
      r !== row &&
      r.dough_seeded &&
      r.retailer_id === row.retailer_id &&
      r.scope_level === row.scope_level &&
      r.geo_region_id === row.geo_region_id &&
      r.retail_location_id === row.retail_location_id,
  )
}

/**
 * Pending reports at a coordinate must share one sku_variant_id.
 * Mixed packs → block Confirm (would assert one truth over many packs).
 */
export function packConflict(reports: AvailabilityReport[]): boolean {
  if (reports.length < 2) return false
  const keys = new Set(
    reports.map((r) => (r.sku_variant_id == null ? 'null' : String(r.sku_variant_id))),
  )
  return keys.size > 1
}

export function shouldShowBannerFilter(rowCount: number): boolean {
  return rowCount > BANNER_FILTER_THRESHOLD
}

export function filterRowsByBannerQuery(
  rows: DistributionRow[],
  query: string,
): DistributionRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (r) =>
      r.retailer_name.toLowerCase().includes(q) ||
      (r.parent_name ?? '').toLowerCase().includes(q) ||
      r.scope_label.toLowerCase().includes(q),
  )
}

/** Peek names for collapsed seed summary. */
export function seedPeekNames(rows: DistributionRow[], take = 3): {
  names: string[]
  remaining: number
} {
  const seen = new Set<string>()
  const names: string[] = []
  for (const r of rows) {
    if (seen.has(r.retailer_name)) continue
    seen.add(r.retailer_name)
    if (names.length < take) names.push(r.retailer_name)
  }
  return { names, remaining: Math.max(0, seen.size - names.length) }
}
