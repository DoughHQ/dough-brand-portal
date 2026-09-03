import type { ApplicationProduct } from '@/components/products/ApplicationProductTile'

export type ApplicationBrandHit = {
  brand_id: number
  brand_name: string
  product_count: number
  sample_products: string[]
}

export type ApplicationProductPreview = {
  brand_id: number
  total_count: number
  with_image_count: number
  products: ApplicationProduct[]
}

function asFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : String(v ?? '').trim()))
    .filter((s) => s.length > 0)
}

export function parseBrandSearchHits(data: unknown): ApplicationBrandHit[] {
  const rows = Array.isArray(data) ? data : []
  const out: ApplicationBrandHit[] = []
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const brandId = asFiniteNumber(o.brand_id)
    const brandName = String(o.brand_name ?? '').trim()
    if (brandId == null || brandId <= 0 || !brandName) continue
    const productCount = asFiniteNumber(o.product_count)
    out.push({
      brand_id: brandId,
      brand_name: brandName,
      product_count: productCount != null && productCount >= 0 ? Math.floor(productCount) : 0,
      sample_products: asStringArray(o.sample_products).slice(0, 3),
    })
  }
  return out
}

export function parseProductPreview(data: unknown): ApplicationProductPreview | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const brandId = asFiniteNumber(o.brand_id)
  if (brandId == null || brandId <= 0) return null

  const total = asFiniteNumber(o.total_count)
  const withImage = asFiniteNumber(o.with_image_count)
  const productsRaw = Array.isArray(o.products) ? o.products : []
  const products: ApplicationProduct[] = []

  for (const raw of productsRaw) {
    if (!raw || typeof raw !== 'object') continue
    const p = raw as Record<string, unknown>
    const productId = asFiniteNumber(p.product_id)
    const name = String(p.name ?? '').trim()
    if (productId == null || productId <= 0 || !name) continue
    products.push({
      product_id: productId,
      name,
      image_url:
        p.image_url == null || String(p.image_url).trim() === ''
          ? null
          : String(p.image_url).trim(),
    })
  }

  return {
    brand_id: brandId,
    total_count: total != null && total >= 0 ? Math.floor(total) : products.length,
    with_image_count: withImage != null && withImage >= 0 ? Math.floor(withImage) : 0,
    products,
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidWorkEmail(email: string): boolean {
  const t = email.trim()
  return t.length > 0 && t.length <= 320 && EMAIL_RE.test(t)
}

export function normalizeLinkedInInput(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  return t.slice(0, 300)
}

export function normalizeRoleTitle(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  return t.slice(0, 120)
}
