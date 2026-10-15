import {
  type DisclosureDraft,
  type ProofSubMetricRow,
  type SourceTier,
} from '@/lib/transparency/disclosures'
import { rowPresence, type RowPresence } from '@/lib/transparency/proofChapters'

export const FINISHED_PRODUCT_SUBJECT = 'Finished product'

export const ORIGIN_DEPTH_CODES = [
  'origin_country',
  'origin_granularity',
  'origin_region',
  'origin_producer_name',
  'origin_geolocation',
] as const

export type OriginDepthCode = (typeof ORIGIN_DEPTH_CODES)[number]

export type OriginLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

export type Props = {
  ingredientStatement: string | null
  fieldsByCode: Record<string, ProofSubMetricRow | undefined>
  rowsByCode: Record<string, OriginLocalRow[]>
  canEdit: boolean
  savingSubject: string | null
  storyError: string | null
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onAddCustomIngredient: (name: string) => void
  onSaveStory: (subject: string) => void
  onSaveCoverage: (row: OriginLocalRow) => void
  onClearStoryError?: () => void
}

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

export function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function findRow(rows: OriginLocalRow[], subject: string): OriginLocalRow | undefined {
  const n = norm(subject)
  return rows.find((r) => norm(r.draft.subjectLabel ?? '') === n)
}

export function storyPresence(
  rows: Partial<Record<OriginDepthCode, OriginLocalRow | undefined>>,
): RowPresence {
  const order: OriginDepthCode[] = [
    'origin_country',
    'origin_region',
    'origin_producer_name',
    'origin_geolocation',
    'origin_granularity',
  ]
  let best: RowPresence = 'not_started'
  for (const code of order) {
    const p = rows[code] ? rowPresence(rows[code]!.draft) : 'not_started'
    if (p === 'published') return 'published'
    if (p === 'private' && best === 'not_started') best = 'private'
    if (p === 'declined' && best === 'not_started') best = 'declined'
  }
  return best
}

export type IngredientLine = {
  name: string
  display: string
  fromLabel: boolean
  kind: 'product' | 'ingredient'
}
