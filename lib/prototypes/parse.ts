import type { BrandPrototypeRow, PrototypePackaging } from './types'
import { isAllergenCode } from './allergens'

function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v)
  return null
}

function asStringArray(v: unknown): string[] | null {
  if (v == null) return null
  if (!Array.isArray(v)) return null
  return v.filter((x): x is string => typeof x === 'string')
}

function asPackaging(v: unknown): PrototypePackaging {
  return v === 'final_packaging' ? 'final_packaging' : 'plain_sample'
}

/** Coerce a brand_prototypes row or save_brand_prototype jsonb into a typed row. */
export function parseBrandPrototype(raw: unknown): BrandPrototypeRow | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const id = asString(r.id)
  const brandId = asNumber(r.brand_id)
  const name = asString(r.name)
  const taxonomyNodeId = asNumber(r.taxonomy_node_id)
  if (!id || brandId == null || !name || taxonomyNodeId == null) return null

  return {
    id,
    brand_id: brandId,
    name,
    internal_label: asString(r.internal_label),
    taxonomy_node_id: taxonomyNodeId,
    packaging: asPackaging(r.packaging),
    planned_price: asNumber(r.planned_price),
    image_paths: asStringArray(r.image_paths) ?? [],
    allergens_contains: asStringArray(r.allergens_contains),
    allergens_may_contain: asStringArray(r.allergens_may_contain),
    allergens_declared_at: asString(r.allergens_declared_at),
    allergens_declared_by: asString(r.allergens_declared_by),
    created_by: asString(r.created_by),
    created_at: asString(r.created_at) ?? new Date().toISOString(),
    updated_at: asString(r.updated_at) ?? new Date().toISOString(),
    archived_at: asString(r.archived_at),
    archived_by: asString(r.archived_by),
  }
}

export function sanitizeAllergenList(codes: string[]): string[] {
  return [...new Set(codes.filter(isAllergenCode))].sort()
}
