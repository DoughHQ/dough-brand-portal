import {
  type DisclosureDraft,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'
import { type BrandProofAskCount } from '@/lib/transparency/proofAskCounts'

export const PLANET_PCF_CODES = [
  'product_carbon_footprint',
  'pcf_assurance_level',
] as const

export const PLANET_PACK_CODES = [
  'packaging_primary_material',
  'packaging_disposal_route',
  'packaging_recycled_content_pct',
  'packaging_reuse_model',
] as const

export const DEFAULT_PACK_COMPONENTS = ['Bottle', 'Cap', 'Sleeve'] as const

export type PlanetLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

export type Props = {
  fieldsByCode: Record<string, ProofSubMetricRow | undefined>
  rowsByCode: Record<string, PlanetLocalRow[]>
  canEdit: boolean
  savingKey: string | null
  storyError: string | null
  errors: Record<string, string>
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onSaveRow: (field: ProofSubMetricRow, row: PlanetLocalRow) => void
  onSaveBundle: (codes: readonly string[], bundleKey: string) => void
  onClearStoryError?: () => void
  onSeedPackComponents: (names: string[]) => void
  pcfAsk?: BrandProofAskCount | null
}

export const SOURCE_TIERS: { value: SourceTier; label: string; hint: string }[] = [
  {
    value: 'brand_stated',
    label: 'Brand stated',
    hint: 'Fragile for published carbon claims — prefer a document or verification.',
  },
  {
    value: 'brand_document',
    label: 'Brand document',
    hint: 'Link to LCA, EPD, or published footprint report.',
  },
  {
    value: 'third_party_verified',
    label: 'Third-party verified',
    hint: 'Certificate or assurance — issuer and URL required.',
  },
]

export function wholeRow(rows: PlanetLocalRow[] | undefined): PlanetLocalRow | undefined {
  return rows?.[0]
}

export function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function findSubject(rows: PlanetLocalRow[], subject: string): PlanetLocalRow | undefined {
  const n = norm(subject)
  return rows.find((r) => norm(r.draft.subjectLabel ?? '') === n)
}
