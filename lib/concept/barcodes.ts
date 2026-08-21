/**
 * Barcode RPCs used by the concept competitor picker.
 * Same two-field flow as the box builder: UPC → product is unambiguous;
 * product → UPC may require an operator choice.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { ProductBarcodeOption } from './types'

type Client = SupabaseClient<Database>

export type ResolveProductByBarcodeHit = {
  product_id: number
  product_name: string
  brand_name: string
  image_url: string | null
  category: string | null
  taxonomy_node_id: number | null
  matched_barcode: string | null
}

export type ResolveProductByBarcodeResult = {
  found: boolean
  normalized: string | null
  ambiguous: boolean
  match_count: number
  products: ResolveProductByBarcodeHit[]
}

export type ListProductBarcodesResult = {
  barcode_count: number
  requires_choice: boolean
  barcodes: ProductBarcodeOption[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

export function barcodeDigits(query: string): string {
  return query.replace(/\D/g, '')
}

export function looksLikeBarcode(query: string): boolean {
  const n = barcodeDigits(query).length
  return n >= 8 && n <= 14
}

/** Barcode mode waits for a full UPC/EAN (8–14 digits) before hitting the RPC. */
export function isBarcodeSearchReady(query: string): boolean {
  return looksLikeBarcode(query)
}

/**
 * Variants to try against exact-match barcode lookups.
 * Catalog rows are often GTIN-14 (`00076840004492`); operators type UPC-A (`076840004492`).
 */
export function barcodeLookupCandidates(query: string): string[] {
  const digits = barcodeDigits(query)
  const out: string[] = []
  const push = (value: string) => {
    if (value && !out.includes(value)) out.push(value)
  }
  push(query.trim())
  push(digits)
  if (digits.length >= 8 && digits.length < 14) push(digits.padStart(14, '0'))
  return out
}

/** RPC json sometimes arrives as an object, a one-row array, or a JSON string. */
export function unwrapRpcJson(data: unknown): Record<string, unknown> | null {
  if (typeof data === 'string') {
    try {
      return unwrapRpcJson(JSON.parse(data) as unknown)
    } catch {
      return null
    }
  }
  const rec = asRecord(data)
  if (rec) return rec
  if (Array.isArray(data) && data.length > 0) {
    return unwrapRpcJson(data[0])
  }
  return null
}

export function barcodeChoiceLabel(option: ProductBarcodeOption): string {
  const size = [
    option.package_size_value != null ? String(option.package_size_value) : null,
    option.package_size_uom,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
  const extras = [size || null, option.variant_name].filter(
    (b): b is string => !!b && b.trim().length > 0
  )
  return extras.length > 0 ? `${option.barcode} · ${extras.join(' · ')}` : option.barcode
}

/** Attach a UPC only when the barcode uniquely identifies one product. */
export function knownUpcFromBarcodeResolve(
  resolved: ResolveProductByBarcodeResult,
  hit: ResolveProductByBarcodeHit
): string | undefined {
  if (!resolved.found || resolved.ambiguous) return undefined
  return hit.matched_barcode ?? resolved.normalized ?? undefined
}

function parseBarcodeOption(raw: unknown): ProductBarcodeOption | null {
  const row = asRecord(raw)
  if (!row) return null
  const barcode = asString(row.barcode)
  if (!barcode) return null
  return {
    barcode,
    variant_name: asString(row.variant_name),
    package_size_value: asNumber(row.package_size_value),
    package_size_uom: asString(row.package_size_uom),
    package_count: asNumber(row.package_count),
    image_url: asString(row.image_url),
  }
}

function parseProductHit(raw: unknown): ResolveProductByBarcodeHit | null {
  const row = asRecord(raw)
  if (!row) return null
  const productId = asNumber(row.product_id)
  if (productId == null) return null
  return {
    product_id: productId,
    product_name: asString(row.product_name) ?? '',
    brand_name: asString(row.brand_name) ?? '',
    image_url: asString(row.image_url),
    category: asString(row.category),
    taxonomy_node_id: asNumber(row.taxonomy_node_id),
    matched_barcode: asString(row.matched_barcode),
  }
}

export async function resolveProductByBarcode(
  supabase: Client,
  barcode: string
): Promise<ResolveProductByBarcodeResult> {
  const { data, error } = await supabase.rpc('resolve_product_by_barcode', {
    p_barcode: barcode,
  })
  if (error) throw error
  const row = unwrapRpcJson(data)
  if (!row) {
    return {
      found: false,
      normalized: null,
      ambiguous: false,
      match_count: 0,
      products: [],
    }
  }
  const products = Array.isArray(row.products)
    ? row.products.map(parseProductHit).filter((p): p is ResolveProductByBarcodeHit => p != null)
    : []
  const matchCount =
    typeof row.match_count === 'number' && Number.isFinite(row.match_count)
      ? row.match_count
      : products.length
  return {
    found: row.found === true,
    normalized: asString(row.normalized),
    ambiguous: row.ambiguous === true,
    match_count: matchCount,
    products,
  }
}

function lookupRowToHit(
  raw: unknown,
  matchedBarcode: string
): ResolveProductByBarcodeHit | null {
  const row = asRecord(raw)
  if (!row) return null
  const productId = asNumber(row.product_id)
  if (productId == null) return null
  return {
    product_id: productId,
    product_name: asString(row.product_name_display) ?? asString(row.product_name) ?? '',
    brand_name: asString(row.brand_name) ?? '',
    image_url: asString(row.image_url),
    category: asString(row.category_name) ?? asString(row.category),
    taxonomy_node_id: asNumber(row.taxonomy_node_id),
    matched_barcode: matchedBarcode,
  }
}

const EMPTY_BARCODE_RESULT: ResolveProductByBarcodeResult = {
  found: false,
  normalized: null,
  ambiguous: false,
  match_count: 0,
  products: [],
}

/**
 * Barcode-mode product search. Tries `resolve_product_by_barcode` (GTIN-normalized)
 * then `lookup_product_by_barcode` (exact catalog identifier) across UPC/GTIN variants.
 */
export async function searchProductsByBarcode(
  supabase: Client,
  query: string
): Promise<ResolveProductByBarcodeResult> {
  if (!isBarcodeSearchReady(query)) return EMPTY_BARCODE_RESULT

  const candidates = barcodeLookupCandidates(query)
  let sawSuccess = false
  let lastError: unknown = null

  for (const candidate of candidates) {
    try {
      const resolved = await resolveProductByBarcode(supabase, candidate)
      sawSuccess = true
      if (resolved.found && resolved.products.length > 0) return resolved
    } catch (err) {
      lastError = err
    }
  }

  for (const candidate of candidates) {
    try {
      const { data, error } = await supabase.rpc('lookup_product_by_barcode', {
        p_barcode: candidate,
      })
      if (error) throw error
      sawSuccess = true
      const rows = Array.isArray(data) ? data : data != null ? [data] : []
      const products = rows
        .map((raw) => lookupRowToHit(raw, candidate))
        .filter((p): p is ResolveProductByBarcodeHit => p != null)
      if (products.length > 0) {
        const unique = new Map<number, ResolveProductByBarcodeHit>()
        for (const hit of products) unique.set(hit.product_id, hit)
        const list = [...unique.values()]
        return {
          found: true,
          normalized: candidate,
          ambiguous: list.length > 1,
          match_count: list.length,
          products: list,
        }
      }
    } catch (err) {
      lastError = err
    }
  }

  if (!sawSuccess && lastError) throw lastError
  return EMPTY_BARCODE_RESULT
}

export async function listProductBarcodes(
  supabase: Client,
  productId: number
): Promise<ListProductBarcodesResult> {
  const { data, error } = await supabase.rpc('list_product_barcodes', {
    p_product_id: productId,
  })
  if (error) throw error
  const row = unwrapRpcJson(data)
  const barcodes = Array.isArray(row?.barcodes)
    ? row.barcodes.map(parseBarcodeOption).filter((b): b is ProductBarcodeOption => b != null)
    : []
  const count =
    typeof row?.barcode_count === 'number' && Number.isFinite(row.barcode_count)
      ? row.barcode_count
      : barcodes.length
  return {
    barcode_count: count,
    requires_choice: row?.requires_choice === true || barcodes.length > 1,
    barcodes,
  }
}

export async function loadProductBarcodeState(
  supabase: Client,
  productId: number,
  knownUpc?: string | null
): Promise<{ upc: string | null; barcodeOptions: ProductBarcodeOption[] }> {
  if (knownUpc?.trim()) {
    return { upc: knownUpc.trim(), barcodeOptions: [] }
  }
  const listed = await listProductBarcodes(supabase, productId)
  if (listed.barcode_count === 0 || listed.barcodes.length === 0) {
    return { upc: null, barcodeOptions: [] }
  }
  if (!listed.requires_choice && listed.barcodes.length === 1) {
    return { upc: listed.barcodes[0]!.barcode, barcodeOptions: [] }
  }
  if (listed.requires_choice) {
    return { upc: null, barcodeOptions: listed.barcodes }
  }
  return { upc: null, barcodeOptions: [] }
}
