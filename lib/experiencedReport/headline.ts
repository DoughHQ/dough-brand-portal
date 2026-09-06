import type { HeadlineWinRateRow } from './types'
import type { ExperiencedReportEnvelope } from './types'

export function stageChipLabel(
  stage: ExperiencedReportEnvelope['report']['report_stage']
): string {
  if (stage.is_final || stage.stage === 'final') return 'Final'
  return 'Preliminary — still collecting'
}

export function headlineStatusChip(rows: HeadlineWinRateRow[]): {
  label: string
  tone: 'pro' | 'amber' | 'neutral'
} {
  if (rows.length === 0) return { label: 'No headline', tone: 'neutral' }
  if (rows.every((r) => !r.reportable)) return { label: 'Below floor', tone: 'amber' }
  if (rows.some((r) => r.reportable)) return { label: 'Reportable', tone: 'pro' }
  return { label: 'Measured', tone: 'neutral' }
}

/** Stronger claim first — never pool. */
export function orderedHeadlineRows(rows: HeadlineWinRateRow[]): HeadlineWinRateRow[] {
  return [...rows].sort((a, b) => {
    const rank = (s: string) =>
      s === 'experienced_vs_experienced' ? 0 : s === 'experienced_vs_hypothetical' ? 1 : 2
    return rank(String(a.experience_split)) - rank(String(b.experience_split))
  })
}

export function leadHeadlineRow(rows: HeadlineWinRateRow[]): HeadlineWinRateRow | null {
  const ordered = orderedHeadlineRows(rows)
  return ordered.length > 0 ? ordered[0] : null
}
