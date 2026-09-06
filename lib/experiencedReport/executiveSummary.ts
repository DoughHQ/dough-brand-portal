import type {
  DriverRow,
  ExperiencedReportEnvelope,
  ExperiencedReportPayload,
  HeadlineWinRateRow,
  Participation,
  RepurchaseSessionMetric,
} from './types'
import { formatOf100 } from './withheldCopy'
import {
  headlineStatusChip,
  leadHeadlineRow,
  stageChipLabel,
} from './headline'

/** Unit-scale a stored rate / CI. Values already on 0–100 become 0–1. Never use on Elo. */
export function asUnit(v: number): number {
  return v > 1 ? v / 100 : v
}

export function asOf100(v: number): number {
  return Math.round(asUnit(v) * 100)
}

export const STRIP_CONFIDENCE_NOTE =
  'Strip confidence: High if (ci_high − ci_low) < 0.10, Moderate if < 0.20, else Wide interval (unit scale).'

export type HeadlineStatus = ReturnType<typeof headlineStatusChip>

export type ConfidenceLabel =
  | 'No headline yet'
  | 'Below reporting floor'
  | 'High confidence'
  | 'Moderate confidence'
  | 'Wide interval'

export type DriverPick = {
  driver: string
  share: number
  n_citing: number | null
}

export type Direction = 'more' | 'less' | 'close'

export type ExecutiveSummary = {
  mode: 'strip' | 'thin'
  productName: string
  headline: HeadlineWinRateRow | null
  headlineStatus: HeadlineStatus
  preferenceReportable: boolean
  chosenOf100: number | null
  ciLow100: number | null
  ciHigh100: number | null
  nDecisive: number | null
  direction: Direction | null
  definiteYes: RepurchaseSessionMetric | null
  topTwoBox: RepurchaseSessionMetric | null
  topDriver: DriverPick | null
  topHeadwind: DriverPick | null
  confidence: ConfidenceLabel
  stageLabel: string
  synthesis: string | null
  participationLine: string
}

export function participationLine(p: Participation): string {
  const people =
    p.n_users === 1 ? '1 person who’s had it' : `${p.n_users} people who’ve had it`
  const sessions = p.n_sessions === 1 ? '1 session' : `${p.n_sessions} sessions`
  return `${people} · ${sessions}`
}

export function pickTopDriver(rows: DriverRow[] | null | undefined): DriverPick | null {
  const list = rows ?? []
  const qualifying = list.filter(
    (r) => r.reportable && r.share != null && Number.isFinite(r.share)
  )
  if (qualifying.length === 0) return null
  const withCiting = qualifying.filter(
    (r) => typeof r.n_citing === 'number' && r.n_citing > 0
  )
  const pool = withCiting.length > 0 ? withCiting : qualifying
  const sorted = [...pool].sort((a, b) => {
    const shareDelta = (b.share ?? 0) - (a.share ?? 0)
    if (shareDelta !== 0) return shareDelta
    const citingDelta = (b.n_citing ?? 0) - (a.n_citing ?? 0)
    if (citingDelta !== 0) return citingDelta
    return a.driver.localeCompare(b.driver)
  })
  const win = sorted[0]
  if (!win || win.share == null) return null
  return { driver: win.driver, share: win.share, n_citing: win.n_citing ?? null }
}

function session1Rows(report: ExperiencedReportPayload): RepurchaseSessionMetric[] {
  return (report.repurchase_intent?.by_session ?? []).filter((r) => r.session_number === 1)
}

function pickMetric(
  rows: RepurchaseSessionMetric[],
  metric: string
): RepurchaseSessionMetric | null {
  const row = rows.find((r) => r.metric === metric)
  if (!row || !row.reportable || row.rate == null) return null
  return row
}

function confidenceLabel(row: HeadlineWinRateRow | null): ConfidenceLabel {
  if (row == null) return 'No headline yet'
  if (!row.reportable) return 'Below reporting floor'
  if (row.ci_low == null || row.ci_high == null) return 'Wide interval'
  const width = Math.abs(asUnit(row.ci_high) - asUnit(row.ci_low))
  if (width < 0.1) return 'High confidence'
  if (width < 0.2) return 'Moderate confidence'
  return 'Wide interval'
}

function directionFromCi(row: HeadlineWinRateRow): Direction {
  if (row.ci_low == null || row.ci_high == null) return 'close'
  const lo = asUnit(row.ci_low)
  const hi = asUnit(row.ci_high)
  if (lo > 0.5) return 'more'
  if (hi < 0.5) return 'less'
  return 'close'
}

function directionPhrase(dir: Direction): string {
  if (dir === 'more') return 'was chosen more often than not against this panel'
  if (dir === 'less') return 'was chosen less often than not against this panel'
  return 'was too close to call against this panel'
}

function assembleSynthesis(summary: Omit<ExecutiveSummary, 'synthesis' | 'mode'>): string | null {
  if (!summary.preferenceReportable || summary.chosenOf100 == null) return null

  const clauses: string[] = []
  const dir = summary.direction ?? 'close'
  const pct = summary.chosenOf100
  const n = summary.nDecisive
  const nBit =
    typeof n === 'number' && n > 0 ? `${pct} of ${n} forced choices` : `${pct} of 100`
  clauses.push(
    `Among people who have consumed it, ${summary.productName} ${directionPhrase(dir)} (${nBit}).`
  )

  const driverBits: string[] = []
  if (summary.topDriver) {
    driverBits.push(`${summary.topDriver.driver} was the leading reason for choice`)
  }
  if (summary.topHeadwind) {
    driverBits.push(`${summary.topHeadwind.driver} was the leading reason against`)
  }
  if (driverBits.length > 0) {
    clauses.push(`${driverBits.join('; ')}.`)
  }

  if (summary.definiteYes?.rate != null) {
    const yes = formatOf100(summary.definiteYes.rate)
    const ttb =
      summary.topTwoBox?.rate != null
        ? ` (${formatOf100(summary.topTwoBox.rate)}% yes or maybe)`
        : ''
    clauses.push(`${yes}% would definitely buy again${ttb}.`)
  }

  return clauses.join(' ')
}

export function deriveExecutiveSummary(envelope: ExperiencedReportEnvelope): ExecutiveSummary {
  const { report } = envelope
  const headline = leadHeadlineRow(report.headline_win_rate)
  const preferenceReportable = Boolean(
    headline && headline.reportable && headline.value != null
  )
  const session1 = session1Rows(report)
  const definiteYes = pickMetric(session1, 'definite_yes')
  const topTwoBox = definiteYes ? pickMetric(session1, 'top_two_box') : null
  const topDriver = pickTopDriver(report.choice_drivers?.by_outcome.focal_won)
  const topHeadwind = pickTopDriver(report.choice_drivers?.by_outcome.focal_lost)

  const tile1 = preferenceReportable
  const tile2 = definiteYes != null
  const tile3 = topDriver != null
  const tile4 = topHeadwind != null
  const mode: 'strip' | 'thin' = tile1 || tile2 || tile3 || tile4 ? 'strip' : 'thin'

  const chosenOf100 =
    preferenceReportable && headline?.value != null ? asOf100(headline.value) : null
  const ciLow100 =
    headline?.ci_low != null && preferenceReportable ? asOf100(headline.ci_low) : null
  const ciHigh100 =
    headline?.ci_high != null && preferenceReportable ? asOf100(headline.ci_high) : null
  const nDecisive =
    typeof headline?.n_decisive === 'number' && headline.n_decisive > 0
      ? headline.n_decisive
      : null

  const base = {
    productName: report.focal_product.name,
    headline,
    headlineStatus: headlineStatusChip(report.headline_win_rate),
    preferenceReportable,
    chosenOf100,
    ciLow100,
    ciHigh100,
    nDecisive,
    direction: preferenceReportable && headline ? directionFromCi(headline) : null,
    definiteYes,
    topTwoBox,
    topDriver,
    topHeadwind,
    confidence: confidenceLabel(headline),
    stageLabel: stageChipLabel(report.report_stage),
    participationLine: participationLine(report.participation),
  }

  return {
    ...base,
    mode,
    synthesis: assembleSynthesis(base),
  }
}
