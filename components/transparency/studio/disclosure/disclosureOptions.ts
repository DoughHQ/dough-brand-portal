import {
  type DisclosureStatus,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'

export const STATUS_OPTIONS: { value: DisclosureStatus; label: string }[] = [
  { value: 'disclosed', label: 'Disclosed' },
  { value: 'not_disclosed', label: 'We don’t report this' },
  { value: 'not_applicable', label: 'Not applicable' },
  { value: 'unknown', label: 'Unknown' },
]

export const SOURCE_TIERS: { value: SourceTier; label: string; hint: string }[] = [
  {
    value: 'brand_stated',
    label: 'Brand stated',
    hint: 'Your claim — no document link required.',
  },
  {
    value: 'brand_document',
    label: 'Brand document',
    hint: 'Link to a page, PDF, or report you publish.',
  },
  {
    value: 'third_party_verified',
    label: 'Third-party verified',
    hint: 'Certificate or audit — issuer and URL required.',
  },
]

export function isIsoCountryField(field: ProofSubMetricRow): boolean {
  return (
    field.value_kind === 'enum' &&
    Array.isArray(field.allowed_values) &&
    field.allowed_values.length === 1 &&
    field.allowed_values[0] === 'ISO_3166_1_alpha_2'
  )
}
