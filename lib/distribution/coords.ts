/** Coordinate identity for distribution rows — never use display labels as keys. */

export type DistributionCoord = {
  retailer_id: number
  scope_level: string
  geo_region_id: number | null
  retail_location_id: number | null
  sku_variant_id: number | null
}

const NULL_TOKEN = 'n'

function enc(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return NULL_TOKEN
  return String(v)
}

function dec(raw: string): number | null {
  if (raw === NULL_TOKEN || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** Serialize for `?coord=` deep links. */
export function serializeCoord(c: DistributionCoord): string {
  return [
    enc(c.retailer_id),
    c.scope_level || 'region',
    enc(c.geo_region_id),
    enc(c.retail_location_id),
    enc(c.sku_variant_id),
  ].join('|')
}

export function parseCoord(raw: string | null | undefined): DistributionCoord | null {
  if (!raw) return null
  const parts = raw.split('|')
  if (parts.length !== 5) return null
  const retailer_id = dec(parts[0]!)
  if (retailer_id == null) return null
  const scope_level = parts[1]!.trim()
  if (!scope_level) return null
  return {
    retailer_id,
    scope_level,
    geo_region_id: dec(parts[2]!),
    retail_location_id: dec(parts[3]!),
    sku_variant_id: dec(parts[4]!),
  }
}

export function coordsEqual(a: DistributionCoord, b: DistributionCoord): boolean {
  return (
    a.retailer_id === b.retailer_id &&
    a.scope_level === b.scope_level &&
    a.geo_region_id === b.geo_region_id &&
    a.retail_location_id === b.retail_location_id &&
    a.sku_variant_id === b.sku_variant_id
  )
}

export function coordFromRow(row: {
  retailer_id: number
  scope_level: string
  geo_region_id: number | null
  retail_location_id: number | null
  sku_variant_id: number | null
}): DistributionCoord {
  return {
    retailer_id: row.retailer_id,
    scope_level: row.scope_level,
    geo_region_id: row.geo_region_id,
    retail_location_id: row.retail_location_id,
    sku_variant_id: row.sku_variant_id,
  }
}
