/** Portal inbox for shopper Proof asks. Counts only — no user ids. */

export const PCF_ASK_CODE = 'product_carbon_footprint'

export type BrandProofAskCount = {
  subMetricCode: string
  label: string | null
  pillar: string | null
  productAskCount: number
  brandAskCount: number
  firstAskedAt: string | null
  lastAskedAt: string | null
}

export type PlanetDemandTone = 'product' | 'catalog' | 'answered'

export type PlanetDemandCopy = {
  tone: PlanetDemandTone
  count: number
  kicker: string
  countNoun: string
  shopperSees: string | null
  catalogLine: string | null
  recencyLine: string | null
  closeLine: string
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return null
  return data as Record<string, unknown>
}

function asText(value: unknown): string | null {
  if (value == null || value === '') return null
  const s = String(value).trim()
  return s ? s : null
}

function asInt(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0
}

function parseRow(raw: unknown): BrandProofAskCount | null {
  const o = asRecord(raw)
  if (!o) return null
  const subMetricCode = asText(o.sub_metric_code) ?? asText(o.subMetricCode)
  if (!subMetricCode) return null
  return {
    subMetricCode,
    label: asText(o.label),
    pillar: asText(o.pillar),
    productAskCount: asInt(
      o.product_ask_count ?? o.productAskCount ?? o.ask_count,
    ),
    brandAskCount: asInt(o.brand_ask_count ?? o.brandAskCount),
    firstAskedAt: asText(o.first_asked_at ?? o.firstAskedAt),
    lastAskedAt: asText(o.last_asked_at ?? o.lastAskedAt),
  }
}

/** Accept a TABLE array, a single row, or a jsonb wrapper. */
export function parseBrandProofAskCounts(data: unknown): BrandProofAskCount[] {
  if (data == null) return []
  if (Array.isArray(data)) {
    return data.map(parseRow).filter((row): row is BrandProofAskCount => row != null)
  }
  const o = asRecord(data)
  if (!o) return []
  if (Array.isArray(o.rows)) return parseBrandProofAskCounts(o.rows)
  if (Array.isArray(o.data)) return parseBrandProofAskCounts(o.data)
  const one = parseRow(o)
  return one ? [one] : []
}

export function selectPcfAsk(
  rows: BrandProofAskCount[],
): BrandProofAskCount | null {
  return rows.find((row) => row.subMetricCode === PCF_ASK_CODE) ?? null
}

export function proofTabAskBadge(row: BrandProofAskCount | null): number {
  if (!row) return 0
  return row.productAskCount
}

export function proofTabAskAria(count: number): string {
  if (count <= 0) return 'P.R.O.O.F.'
  if (count === 1) return 'P.R.O.O.F., 1 shopper asked'
  return `P.R.O.O.F., ${count.toLocaleString()} shoppers asked`
}

export function askedWhen(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  const days = Math.floor((now - t) / 86_400_000)
  if (days < 0) return null
  if (days === 0) return 'Last asked today'
  if (days === 1) return 'Last asked yesterday'
  if (days < 30) return `Last asked ${days} days ago`
  if (days < 365) {
    const months = Math.max(1, Math.floor(days / 30))
    return months === 1 ? 'Last asked 1 month ago' : `Last asked ${months} months ago`
  }
  const years = Math.max(1, Math.floor(days / 365))
  return years === 1 ? 'Last asked 1 year ago' : `Last asked ${years} years ago`
}

function shoppersWord(n: number): string {
  return n === 1 ? 'shopper' : 'shoppers'
}

export function planetDemandCopy(args: {
  productAskCount: number
  brandAskCount: number
  lastAskedAt: string | null
  published: boolean
  now?: number
}): PlanetDemandCopy | null {
  const product = Math.max(0, Math.trunc(args.productAskCount) || 0)
  const brand = Math.max(0, Math.trunc(args.brandAskCount) || 0)
  const recencyLine = askedWhen(args.lastAskedAt, args.now)

  if (product === 0 && brand === 0) return null

  if (product === 0 && brand > 0) {
    return {
      tone: 'catalog',
      count: brand,
      kicker: 'Across your catalog',
      countNoun: `${shoppersWord(brand)} asked for a carbon footprint on your other products.`,
      shopperSees: 'No published carbon footprint.',
      catalogLine: null,
      recencyLine,
      closeLine:
        'This SKU is still silent. The number goes in the fields below. Publish it and the hole closes.',
    }
  }

  const extra = brand > product ? brand : 0
  const catalogLine =
    extra > product
      ? `${brand.toLocaleString()} ${shoppersWord(brand)} asked across your catalog.`
      : null

  if (args.published) {
    return {
      tone: 'answered',
      count: product,
      kicker: 'Shoppers asked',
      countNoun: `${shoppersWord(product)} asked for this product’s carbon footprint.`,
      shopperSees: null,
      catalogLine,
      recencyLine,
      closeLine: 'It’s on the product page. The ask stays on the record.',
    }
  }

  return {
    tone: 'product',
    count: product,
    kicker: 'Shoppers asked',
    countNoun: `${shoppersWord(product)} asked for this product’s carbon footprint.`,
    shopperSees: 'No published carbon footprint.',
    catalogLine,
    recencyLine,
    closeLine:
      'The number goes in the fields below. Publish it and this hole closes.',
  }
}
