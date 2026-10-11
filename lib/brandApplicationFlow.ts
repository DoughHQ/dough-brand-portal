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

/** Same shape as brand_waitlist_website_shape (Postgres POSIX, case-insensitive). */
const BRAND_WEBSITE_RE =
  /^(https?:\/\/)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{1,5})?([/?#]\S*)?$/i

export function isValidWorkEmail(email: string): boolean {
  const t = email.trim()
  return t.length > 0 && t.length <= 320 && EMAIL_RE.test(t)
}

/**
 * Empty is valid (caller decides required vs optional). Non-empty must match
 * the DB CHECK and stay ≤ 300 characters.
 */
export function isValidBrandWebsite(raw: string): boolean {
  const t = raw.trim()
  if (!t) return true
  if (t.length > 300) return false
  return BRAND_WEBSITE_RE.test(t)
}

export function normalizeBrandWebsite(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  return t.slice(0, 300)
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
