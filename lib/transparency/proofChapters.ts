import { formatProofCode, formatUnitSuffix } from '@/lib/transparency/displayMap'
import type { DisclosureDraft, ProofSubMetricRow } from '@/lib/transparency/disclosures'

export type ProofChapterId = 'planet' | 'rights' | 'origin' | 'operations' | 'formula'

export type ProofChapter = {
  id: ProofChapterId
  letter: string
  name: string
  /** One ethical sentence — shopper honesty framing */
  lede: string
  metricCodes: string[]
}

/**
 * P.R.O.O.F. is portal navigation only. Registry metric_codes stay canonical.
 * Unknown metrics fall through to Operations so nothing is orphaned.
 */
export const PROOF_CHAPTERS: ProofChapter[] = [
  {
    id: 'planet',
    letter: 'P',
    name: 'Planet',
    lede: 'Footprint and packaging — measured claims, never green theatre.',
    metricCodes: ['product_footprint', 'packaging', 'land_and_soil', 'corporate_footprint'],
  },
  {
    id: 'rights',
    letter: 'R',
    name: 'Rights',
    lede: 'How living things and people are treated in this product’s story.',
    metricCodes: [
      'animal_welfare',
      'labor_standards',
      'social_certification',
      'human_rights',
      'grievance',
      'supplier_visibility',
      'sourcing_risk',
    ],
  },
  {
    id: 'origin',
    letter: 'O',
    name: 'Origin',
    lede: 'Where this product and its named parts come from — place stories you can stand behind.',
    metricCodes: ['origin', 'supply_chain', 'key_dates', 'lot_traceability'],
  },
  {
    id: 'operations',
    letter: 'O',
    name: 'Operations',
    lede: 'How it’s made, treated, aided, and stored — four rooms, process as fact.',
    metricCodes: ['process', 'treatments', 'additives', 'storage'],
  },
  {
    id: 'formula',
    letter: 'F',
    name: 'Formula',
    lede: 'What’s in it — and how much. Seeded from the label; deepen what you want shoppers to know.',
    metricCodes: ['ingredients'],
  },
]

const metricToChapter = new Map<string, ProofChapterId>()
for (const ch of PROOF_CHAPTERS) {
  for (const code of ch.metricCodes) {
    metricToChapter.set(code, ch.id)
  }
}

export function chapterForMetric(metricCode: string): ProofChapterId {
  return metricToChapter.get(metricCode) ?? 'operations'
}

export type RowPresence = 'not_started' | 'private' | 'published' | 'declined'

export function rowPresence(draft: DisclosureDraft | null | undefined): RowPresence {
  if (!draft || draft.disclosureId == null) return 'not_started'
  if (
    draft.status === 'not_disclosed' ||
    draft.status === 'not_applicable' ||
    draft.status === 'unknown'
  ) {
    return draft.published ? 'published' : 'declined'
  }
  if (draft.published) return 'published'
  return 'private'
}

export function presenceLabel(p: RowPresence): string {
  switch (p) {
    case 'not_started':
      return 'Not started'
    case 'private':
      return 'Saved · private'
    case 'published':
      return 'Shown to shoppers'
    case 'declined':
      return 'Chose not to report'
  }
}

function formatAsOfShort(date: string | null | undefined): string | null {
  if (!date) return null
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function valueSummary(field: ProofSubMetricRow, draft: DisclosureDraft): string {
  if (draft.status === 'not_disclosed') return 'The brand chose not to report this'
  if (draft.status === 'not_applicable') return 'Not applicable'
  if (draft.status === 'unknown') return 'Unknown'

  if (draft.valueText === 'other' && draft.otherText?.trim()) {
    return draft.otherText.trim()
  }

  if (field.sub_metric_code === 'product_carbon_footprint' && draft.valueNum != null) {
    const unit = formatUnitSuffix(draft.valueUnit)
    const head = `${draft.valueNum} ${unit}`.trim()
    const quals = [
      draft.boundaryCode ? formatProofCode(draft.boundaryCode) : null,
      draft.methodCode ? formatProofCode(draft.methodCode) : null,
      draft.dataQuality ? formatProofCode(draft.dataQuality) : null,
    ].filter(Boolean)
    return quals.length ? `${head} · ${quals.join(' · ')}` : head
  }

  if (draft.valueNum != null) {
    const unit = formatUnitSuffix(draft.valueUnit ?? field.unit)
    return unit ? `${draft.valueNum} ${unit}` : String(draft.valueNum)
  }
  if (draft.valueBool != null) return draft.valueBool ? 'Yes' : 'No'
  if (draft.valueDate) return draft.valueDate
  if (draft.valueText) return formatProofCode(draft.valueText)
  return '—'
}

function provenanceWhisper(draft: DisclosureDraft): string | null {
  if (draft.status !== 'disclosed') return null
  if (draft.sourceTier === 'third_party_verified') {
    return draft.issuerName?.trim()
      ? `Verified by ${draft.issuerName.trim()}`
      : 'Third-party verified'
  }
  if (draft.sourceTier === 'brand_document') return 'Brand document'
  return 'Stated by the brand'
}

export type InventorySummary = {
  presence: RowPresence
  presenceLabel: string
  title: string
  detail: string | null
  whisper: string | null
  asOf: string | null
}

/** Compact list-row copy for one disclosure (or blank starter). */
export function summarizeInventoryRow(
  field: ProofSubMetricRow,
  draft: DisclosureDraft,
): InventorySummary {
  const presence = rowPresence(draft)
  const subject = draft.subjectLabel?.trim()
  const isOrigin =
    field.sub_metric_code === 'origin_country' ||
    field.sub_metric_code.startsWith('origin_')

  if (presence === 'not_started') {
    return {
      presence,
      presenceLabel: presenceLabel(presence),
      title: field.label,
      detail: null,
      whisper: null,
      asOf: null,
    }
  }

  const value = valueSummary(field, draft)
  let title = field.label
  let detail: string | null = value

  if (subject && isOrigin && draft.status === 'disclosed') {
    const sub = subject.charAt(0).toUpperCase() + subject.slice(1)
    title = `${sub} — ${value}`
    detail = field.label
  } else if (subject) {
    detail = `${subject} · ${value}`
  }

  return {
    presence,
    presenceLabel: presenceLabel(presence),
    title,
    detail: presence === 'declined' && !subject ? null : detail,
    whisper: provenanceWhisper(draft),
    asOf: formatAsOfShort(draft.asofDate),
  }
}

export type ChapterProgress = {
  total: number
  started: number
  published: number
}

export function chapterProgress(
  fields: ProofSubMetricRow[],
  rowsByCode: Record<string, { draft: DisclosureDraft }[]>,
): ChapterProgress {
  let total = 0
  let started = 0
  let published = 0
  for (const field of fields) {
    const rows = rowsByCode[field.sub_metric_code] ?? []
    if (rows.length === 0) {
      total += 1
      continue
    }
    for (const row of rows) {
      total += 1
      const p = rowPresence(row.draft)
      if (p !== 'not_started') started += 1
      if (p === 'published') published += 1
    }
  }
  return { total, started, published }
}
