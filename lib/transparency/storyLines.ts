/**
 * Composed shopper-facing lines for transparency stories.
 * Keep compose* helpers identical to dough_app/src/lib/transparency/storyLines.ts
 */
import { formatProofCode, formatUnitSuffix } from './displayMap'
import {
  PROOF_CHAPTERS,
  chapterForMetric,
  type ProofChapter,
  type ProofChapterId,
} from './proofChapters'

export type { ProofChapter, ProofChapterId }
export { PROOF_CHAPTERS, chapterForMetric }

/** Minimal row shape for composition (portal drafts or consumer RPC rows). */
export type StoryValueRow = {
  sub_metric_code: string
  metric_code?: string | null
  subject_label?: string | null
  status?: string | null
  value_text?: string | null
  value_num?: number | null
  value_unit?: string | null
  method_code?: string | null
  boundary_code?: string | null
  data_quality?: string | null
  other_text?: string | null
  source_tier?: string | null
  issuer_name?: string | null
}

export function composePlaceLine(args: {
  country?: string | null
  region?: string | null
  producer?: string | null
}): string {
  const parts: string[] = []
  if (args.country?.trim()) parts.push(formatProofCode(args.country.trim().toUpperCase()))
  if (args.region?.trim()) parts.push(args.region.trim())
  if (args.producer?.trim()) parts.push(args.producer.trim())
  return parts.join(' · ')
}

export function composePlaceStory(subject: string, rows: StoryValueRow[]): string {
  const byCode = (code: string) =>
    rows.find((r) => r.sub_metric_code === code && (r.status ?? 'disclosed') === 'disclosed')
  const place = composePlaceLine({
    country: byCode('origin_country')?.value_text,
    region: byCode('origin_region')?.value_text,
    producer: byCode('origin_producer_name')?.value_text,
  })
  const sub = subject.trim().charAt(0).toUpperCase() + subject.trim().slice(1)
  return place ? `${sub} — ${place}` : sub
}

export function composeFormulaLine(args: {
  subject: string
  percent?: number | null
  breakout?: string | null
}): string {
  const sub = args.subject.trim().charAt(0).toUpperCase() + args.subject.trim().slice(1)
  const parts = [sub]
  if (args.percent != null && !Number.isNaN(args.percent)) {
    parts.push(`${args.percent}%`)
  }
  if (args.breakout?.trim()) parts.push(args.breakout.trim())
  return parts.join(' · ')
}

export function composeMadeLine(method?: string | null, parameter?: string | null): string {
  const parts: string[] = []
  if (method?.trim()) parts.push(formatProofCode(method.trim()))
  if (parameter?.trim()) parts.push(parameter.trim())
  return parts.join(' · ')
}

export function composeKeptLine(
  condition?: string | null,
  basis?: string | null,
  note?: string | null,
): string {
  const parts: string[] = []
  if (condition?.trim()) parts.push(formatProofCode(condition.trim()))
  if (basis?.trim()) parts.push(formatProofCode(basis.trim()))
  if (note?.trim()) parts.push(note.trim())
  return parts.join(' · ')
}

export function composePcfLine(args: {
  valueNum?: number | null
  valueUnit?: string | null
  boundaryCode?: string | null
  methodCode?: string | null
  dataQuality?: string | null
}): string {
  if (args.valueNum == null || Number.isNaN(args.valueNum)) return ''
  const unit = formatUnitSuffix(args.valueUnit)
  const head = `${args.valueNum} ${unit}`.trim()
  const quals = [
    args.boundaryCode ? formatProofCode(args.boundaryCode) : null,
    args.methodCode ? formatProofCode(args.methodCode) : null,
    args.dataQuality ? formatProofCode(args.dataQuality) : null,
  ].filter(Boolean)
  return quals.length ? `${head} — ${quals.join(', ')}` : head
}

export function composePackLine(args: {
  component: string
  material?: string | null
  disposal?: string | null
  recycledPct?: number | null
  reuse?: string | null
}): string {
  const parts = [
    args.component.trim().charAt(0).toUpperCase() + args.component.trim().slice(1),
  ]
  if (args.material?.trim()) parts.push(formatProofCode(args.material.trim()))
  if (args.disposal?.trim()) parts.push(formatProofCode(args.disposal.trim()))
  if (args.recycledPct != null && !Number.isNaN(args.recycledPct)) {
    parts.push(`${args.recycledPct}% recycled`)
  }
  if (args.reuse?.trim()) parts.push(formatProofCode(args.reuse.trim()))
  return parts.join(' · ')
}

export function provenanceWhisperFromTier(args: {
  status?: string | null
  sourceTier?: string | null
  issuerName?: string | null
}): string | null {
  if (args.status && args.status !== 'disclosed') return null
  if (args.sourceTier === 'third_party_verified') {
    return args.issuerName?.trim()
      ? `Verified by ${args.issuerName.trim()}`
      : 'Third-party verified'
  }
  if (args.sourceTier === 'brand_document') return 'Brand document'
  if (args.sourceTier === 'brand_stated' || !args.sourceTier) return 'Stated by the brand'
  return 'Stated by the brand'
}

export type ChapterGroup<T extends { metric_code: string }> = {
  chapter: ProofChapter
  rows: T[]
}

/** Group published disclosure rows into P.R.O.O.F. chapters; skip empty chapters. */
export function groupDisclosuresByChapter<T extends { metric_code: string }>(
  rows: T[],
): ChapterGroup<T>[] {
  const buckets = new Map<ProofChapterId, T[]>()
  for (const ch of PROOF_CHAPTERS) buckets.set(ch.id, [])
  for (const row of rows) {
    const id = chapterForMetric(row.metric_code)
    buckets.get(id)!.push(row)
  }
  return PROOF_CHAPTERS.flatMap((chapter) => {
    const list = buckets.get(chapter.id) ?? []
    if (list.length === 0) return []
    return [{ chapter, rows: list }]
  })
}

export function normSubject(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function subjectTitle(s: string): string {
  const t = s.trim()
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1)
}
