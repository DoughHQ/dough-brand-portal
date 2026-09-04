export type ApplicationBrandHit = {
  brand_id: number
  brand_name: string
  product_count: number
  sample_products: string[]
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
