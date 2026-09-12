import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { messageFromDistributionError, messageFromCapabilityReason } from './errors'
import type { AvailabilityReport, DistributionRow } from './grouping'

type Client = SupabaseClient<Database>

function nullNum(v: number | null | undefined): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function nullStr(v: string | null | undefined): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function normalizeDistributionRow(raw: Record<string, unknown>): DistributionRow {
  return {
    retailer_id: Number(raw.retailer_id),
    retailer_name: String(raw.retailer_name ?? ''),
    parent_name: nullStr(raw.parent_name as string | null),
    retailer_type: nullStr(raw.retailer_type as string | null),
    scope_level: String(raw.scope_level ?? ''),
    geo_region_id: nullNum(raw.geo_region_id as number | null),
    retail_location_id: nullNum(raw.retail_location_id as number | null),
    scope_label: String(raw.scope_label ?? ''),
    sku_variant_id: nullNum(raw.sku_variant_id as number | null),
    variant_label: String(raw.variant_label ?? 'All pack sizes'),
    declaration_id: nullNum(raw.declaration_id as number | null),
    brand_status: nullStr(raw.brand_status as string | null),
    brand_declared_at: nullStr(raw.brand_declared_at as string | null),
    brand_delisted_on: nullStr(raw.brand_delisted_on as string | null),
    dough_seeded: Boolean(raw.dough_seeded),
    seed_evidence_url: nullStr(raw.seed_evidence_url as string | null),
    seed_found_at: nullStr(raw.seed_found_at as string | null),
    shopper_reports: Number(raw.shopper_reports ?? 0) || 0,
    last_reported_on: nullStr(raw.last_reported_on as string | null),
    shopper_signal_stale: Boolean(raw.shopper_signal_stale),
    awaiting_review: Number(raw.awaiting_review ?? 0) || 0,
    needs_attention: Boolean(raw.needs_attention),
    covered_by_national: Boolean(raw.covered_by_national),
    national_declaration_id: nullNum(raw.national_declaration_id as number | null),
  }
}

function normalizeReport(raw: Record<string, unknown>): AvailabilityReport {
  return {
    report_id: Number(raw.report_id),
    retailer_id: Number(raw.retailer_id),
    retailer_name: String(raw.retailer_name ?? ''),
    parent_name: nullStr(raw.parent_name as string | null),
    scope_level: String(raw.scope_level ?? ''),
    geo_region_id: nullNum(raw.geo_region_id as number | null),
    retail_location_id: nullNum(raw.retail_location_id as number | null),
    scope_label: String(raw.scope_label ?? ''),
    sku_variant_id: nullNum(raw.sku_variant_id as number | null),
    variant_label: String(raw.variant_label ?? 'Pack size not recorded'),
    report_date: String(raw.report_date ?? ''),
    review_state: String(raw.review_state ?? ''),
    contradicts_delisting: Boolean(raw.contradicts_delisting),
  }
}

export type Capability = {
  allowed: boolean
  reason: string | null
  reasonMessage: string | null
}

export async function fetchCanDeclare(
  supabase: Client,
  productId: number,
): Promise<{ capability: Capability; error: string | null }> {
  const { data, error } = await supabase.rpc('can_declare_availability', {
    p_product_id: productId,
  })
  if (error) {
    return {
      capability: { allowed: false, reason: null, reasonMessage: null },
      error: messageFromDistributionError(error),
    }
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    | { allowed?: boolean; reason?: string | null }
    | undefined
  const allowed = Boolean(row?.allowed)
  const reason = nullStr(row?.reason ?? null)
  return {
    capability: {
      allowed,
      reason,
      reasonMessage: allowed ? null : messageFromCapabilityReason(reason),
    },
    error: null,
  }
}

export async function fetchDistribution(
  supabase: Client,
  productId: number,
): Promise<{ rows: DistributionRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_brand_product_distribution', {
    p_product_id: productId,
  })
  if (error) return { rows: [], error: messageFromDistributionError(error) }
  const rows = ((data ?? []) as Record<string, unknown>[]).map(normalizeDistributionRow)
  return { rows, error: null }
}

export async function fetchPendingReports(
  supabase: Client,
  productId: number,
): Promise<{ reports: AvailabilityReport[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_product_availability_reports', {
    p_product_id: productId,
    p_only_pending: true,
  })
  if (error) return { reports: [], error: messageFromDistributionError(error) }
  const reports = ((data ?? []) as Record<string, unknown>[]).map(normalizeReport)
  return { reports, error: null }
}

export type RetailerOption = {
  id: number
  name: string
  parent_retailer_id: number | null
  retailer_type: string
}

export async function fetchShoppableRetailers(
  supabase: Client,
): Promise<{ retailers: RetailerOption[]; error: string | null }> {
  const { data, error } = await supabase
    .from('retailers')
    .select('id, name, parent_retailer_id, retailer_type')
    .eq('is_shoppable', true)
    .eq('is_active', true)
    .neq('retailer_type', 'parent_company')
    .order('name')
  if (error) return { retailers: [], error: messageFromDistributionError(error) }
  const retailers = ((data ?? []) as RetailerOption[]).map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    parent_retailer_id: r.parent_retailer_id == null ? null : Number(r.parent_retailer_id),
    retailer_type: String(r.retailer_type),
  }))
  return { retailers, error: null }
}

export type RegionOption = {
  geo_region_id: number
  region_type: string
  region_name: string
  region_code: string | null
}

export async function fetchRetailerRegions(
  supabase: Client,
  retailerId: number,
): Promise<{ regions: RegionOption[]; error: string | null }> {
  const { data, error } = await supabase.rpc('list_retailer_distribution_regions', {
    p_retailer_id: retailerId,
  })
  if (error) return { regions: [], error: messageFromDistributionError(error) }
  const regions = ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    geo_region_id: Number(r.geo_region_id),
    region_type: String(r.region_type ?? ''),
    region_name: String(r.region_name ?? ''),
    region_code: nullStr(r.region_code as string | null),
  }))
  return { regions, error: null }
}

export async function declareAvailability(
  supabase: Client,
  args: {
    productId: number
    retailerId: number
    scopeLevel: string
    skuVariantId?: number | null
    geoRegionId?: number | null
    retailLocationId?: number | null
    notes?: string | null
  },
): Promise<{ declarationId: number | null; error: string | null }> {
  const { data, error } = await supabase.rpc('declare_product_availability', {
    p_product_id: args.productId,
    p_retailer_id: args.retailerId,
    p_scope_level: args.scopeLevel,
    p_sku_variant_id: args.skuVariantId ?? undefined,
    p_geo_region_id: args.geoRegionId ?? undefined,
    p_retail_location_id: args.retailLocationId ?? undefined,
    p_notes: args.notes ?? undefined,
  })
  if (error) return { declarationId: null, error: messageFromDistributionError(error) }
  const id = typeof data === 'number' ? data : Number(data)
  return { declarationId: Number.isFinite(id) ? id : null, error: null }
}

export async function withdrawDeclaration(
  supabase: Client,
  declarationId: number,
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.rpc('withdraw_product_availability_declaration', {
    p_declaration_id: declarationId,
  })
  if (error) return { ok: false, error: messageFromDistributionError(error) }
  return { ok: true, error: null }
}

export async function delistDeclaration(
  supabase: Client,
  declarationId: number,
  delistedOn: string,
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.rpc('delist_product_availability', {
    p_declaration_id: declarationId,
    p_delisted_on: delistedOn,
  })
  if (error) return { ok: false, error: messageFromDistributionError(error) }
  return { ok: true, error: null }
}

export type CoordinateReviewResult = {
  reportsAffected: number
  resultingState: string | null
  declarationId: number | null
}

/** Brand-facing review — one decision for every pending report at a coordinate. */
export async function reviewCoordinate(
  supabase: Client,
  args: {
    productId: number
    retailerId: number
    scopeLevel: string
    action: 'confirm' | 'correct' | 'dispute'
    geoRegionId?: number | null
    retailLocationId?: number | null
    skuVariantId?: number | null
    note?: string | null
  },
): Promise<{ result: CoordinateReviewResult | null; error: string | null }> {
  const { data, error } = await supabase.rpc('review_availability_coordinate', {
    p_product_id: args.productId,
    p_retailer_id: args.retailerId,
    p_scope_level: args.scopeLevel,
    p_action: args.action,
    p_geo_region_id: args.geoRegionId ?? undefined,
    p_retail_location_id: args.retailLocationId ?? undefined,
    p_sku_variant_id: args.skuVariantId ?? undefined,
    p_note: args.note ?? undefined,
  })
  if (error) return { result: null, error: messageFromDistributionError(error) }
  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        reports_affected?: number
        resulting_state?: string | null
        declaration_id?: number | null
      }
    | undefined
  return {
    result: {
      reportsAffected: Number(row?.reports_affected ?? 0) || 0,
      resultingState: row?.resulting_state == null ? null : String(row.resulting_state),
      declarationId:
        row?.declaration_id == null || !Number.isFinite(Number(row.declaration_id))
          ? null
          : Number(row.declaration_id),
    },
    error: null,
  }
}
