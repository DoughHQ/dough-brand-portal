import {
  DECOY_ID,
  NONE_OF_THESE,
  NONE_OF_THESE_ID,
  NOT_SURE_ID,
} from './constants'
import type {
  LegibilityOption,
  PackagingTemplateConfig,
  VerificationOption,
} from './types'
import {
  formatPriceDisplay,
  generatePriceBands,
  normalizeExpectedPrice,
} from './priceBands'

export const NOT_SURE = 'Not sure'

export type BrandVerificationOption = Extract<
  VerificationOption,
  { brand_id: number }
>
export type TaxLegibilityOption = Extract<
  LegibilityOption,
  { taxonomy_node_id: number }
>

export type TemplateConfigField =
  | keyof PackagingTemplateConfig
  | 'scoring_rounds'
  | 'template'

export type TemplateConfigError = {
  code: string
  field: TemplateConfigField
  /** Anchor id for scroll-into-view */
  anchor: string
  message: string
}

function filled(s: string): boolean {
  return s.trim().length > 0
}

export function templateFieldAnchor(field: TemplateConfigField): string {
  return `concept-q-${field}`
}

export function isSentinelId(id: string): boolean {
  return id === DECOY_ID || id === NONE_OF_THESE_ID || id === NOT_SURE_ID
}

export function isBrandOption(
  o: VerificationOption
): o is BrandVerificationOption {
  return 'brand_id' in o && typeof o.brand_id === 'number'
}

export function isTaxOption(o: LegibilityOption): o is TaxLegibilityOption {
  return 'taxonomy_node_id' in o && typeof o.taxonomy_node_id === 'number'
}

export function brandVerificationOption(
  brandId: number,
  label: string
): BrandVerificationOption {
  return {
    id: `brand:${brandId}` as `brand:${number}`,
    label: label.trim(),
    brand_id: brandId,
  }
}

export function taxLegibilityOption(
  taxonomyNodeId: number,
  label: string
): TaxLegibilityOption {
  return {
    id: `tax:${taxonomyNodeId}` as `tax:${number}`,
    label: label.trim(),
    taxonomy_node_id: taxonomyNodeId,
  }
}

/** Real brands the operator picked — excludes decoy + none-of-these sentinels. */
export function editableVerificationOptions(
  config: PackagingTemplateConfig
): BrandVerificationOption[] {
  const seen = new Set<number>()
  const out: BrandVerificationOption[] = []
  for (const o of config.verification_options) {
    if (!isBrandOption(o)) continue
    if (!Number.isFinite(o.brand_id) || o.brand_id <= 0) continue
    if (seen.has(o.brand_id)) continue
    if (!o.label.trim()) continue
    seen.add(o.brand_id)
    out.push(brandVerificationOption(o.brand_id, o.label))
  }
  return out
}

/** Real taxonomy siblings the operator selected — excludes the not-sure sentinel. */
export function editableLegibilityOptions(
  config: PackagingTemplateConfig
): TaxLegibilityOption[] {
  const seen = new Set<number>()
  const out: TaxLegibilityOption[] = []
  for (const o of config.legibility_options) {
    if (!isTaxOption(o)) continue
    if (!Number.isFinite(o.taxonomy_node_id) || o.taxonomy_node_id <= 0) continue
    if (seen.has(o.taxonomy_node_id)) continue
    if (!o.label.trim()) continue
    seen.add(o.taxonomy_node_id)
    out.push(taxLegibilityOption(o.taxonomy_node_id, o.label))
  }
  return out
}

/**
 * Wire verification list. Fewer than 2 real brands → no screener (empty).
 * Otherwise brands → optional decoy → none_of_these.
 */
export function composeVerificationOptions(
  config: PackagingTemplateConfig
): VerificationOption[] {
  const brands = editableVerificationOptions(config)
  if (brands.length < 2) return []

  const out: VerificationOption[] = [...brands]
  const decoyLabel = config.decoy_option.trim()
  if (decoyLabel) {
    out.push({ id: DECOY_ID, label: decoyLabel })
  }
  out.push({ id: NONE_OF_THESE_ID, label: NONE_OF_THESE })
  return out
}

/**
 * Wire legibility list. Fewer than 2 selected siblings → no screener (empty).
 * Otherwise tax rows → not_sure.
 */
export function composeLegibilityOptions(
  config: PackagingTemplateConfig
): LegibilityOption[] {
  const cats = editableLegibilityOptions(config)
  if (cats.length < 2) return []
  return [...cats, { id: NOT_SURE_ID, label: NOT_SURE }]
}

export function hasVerificationScreener(config: PackagingTemplateConfig): boolean {
  return editableVerificationOptions(config).length >= 2
}

/** Preview-only bands from expected_price (not stored on the draft). */
export function previewPriceBands(config: PackagingTemplateConfig): string[] {
  return generatePriceBands(normalizeExpectedPrice(config.expected_price) || config.expected_price)
}

/**
 * Validation — named, human errors; key on ids, not labels.
 * Zero verification brands is allowed (soft warning at publish). One brand is not.
 * pack_size + legibility are packaging-only.
 */
export function validateConceptTemplateConfig(
  config: PackagingTemplateConfig,
  mode: 'package' | 'price'
): TemplateConfigError[] {
  const errors: TemplateConfigError[] = []

  if (!filled(config.category_plural)) {
    errors.push({
      code: 'UNRESOLVED_TEMPLATE_TOKEN',
      field: 'category_plural',
      anchor: templateFieldAnchor('category_plural'),
      message: 'Category phrasing is empty — use your taxonomy category.',
    })
  }

  if (mode === 'package' && !filled(config.pack_size)) {
    errors.push({
      code: 'UNRESOLVED_TEMPLATE_TOKEN',
      field: 'pack_size',
      anchor: templateFieldAnchor('pack_size'),
      message: 'Pack size is missing (e.g. “4-pack”).',
    })
  }

  const brands = editableVerificationOptions(config)
  const hasVerificationScreener = brands.length >= 2

  if (brands.length === 1) {
    errors.push({
      code: 'MISSING_TEMPLATE_CONFIG',
      field: 'verification_options',
      anchor: templateFieldAnchor('verification_options'),
      message: 'Add at least two real brands, or none at all.',
    })
  }
  if (hasVerificationScreener && !filled(config.decoy_option)) {
    errors.push({
      code: 'UNRESOLVED_TEMPLATE_TOKEN',
      field: 'decoy_option',
      anchor: templateFieldAnchor('decoy_option'),
      message: 'Add a fake brand name for the attention check.',
    })
  }

  if (mode === 'package') {
    const cats = editableLegibilityOptions(config)
    if (cats.length > 0 && cats.length < 2) {
      errors.push({
        code: 'MISSING_TEMPLATE_CONFIG',
        field: 'legibility_options',
        anchor: templateFieldAnchor('legibility_options'),
        message: 'Select at least two categories, or none at all.',
      })
    }
  }

  const anchor = normalizeExpectedPrice(config.expected_price)
  if (!anchor) {
    errors.push({
      code: 'ANCHOR_PRICE_REQUIRED',
      field: 'expected_price',
      anchor: templateFieldAnchor('expected_price'),
      message: 'Set an expected retail price — bands generate from it.',
    })
  } else if (Number(anchor) <= 0) {
    errors.push({
      code: 'INVALID_ANCHOR',
      field: 'expected_price',
      anchor: templateFieldAnchor('expected_price'),
      message: 'Expected price must be a positive amount like 4.99.',
    })
  }

  return errors
}

/** @deprecated Prefer validateConceptTemplateConfig(config, mode). */
export function validatePackagingTemplateConfig(
  config: PackagingTemplateConfig
): TemplateConfigError[] {
  return validateConceptTemplateConfig(config, 'package')
}

export function packagingTemplateConfigReady(
  config: PackagingTemplateConfig
): boolean {
  return validateConceptTemplateConfig(config, 'package').length === 0
}

export function priceTemplateConfigReady(
  config: PackagingTemplateConfig
): boolean {
  return validateConceptTemplateConfig(config, 'price').length === 0
}

/**
 * Wire-ready config — composed options (with sentinels), price fields.
 * expected_price stays RAW ("8.99"); price_display formatted for copy.
 * Bands are NOT sent — the server generates them from expected_price.
 */
export function templateConfigToWire(
  config: PackagingTemplateConfig
): PackagingTemplateConfig {
  const anchor = normalizeExpectedPrice(config.expected_price)
  return {
    category_plural: config.category_plural.trim(),
    pack_size: config.pack_size.trim(),
    price_display: formatPriceDisplay(anchor) || config.price_display.trim(),
    decoy_option: config.decoy_option.trim(),
    verification_options: composeVerificationOptions(config),
    legibility_options: composeLegibilityOptions(config),
    expected_price: anchor,
    price_answer_mode: config.price_answer_mode ?? 'bands',
  }
}
