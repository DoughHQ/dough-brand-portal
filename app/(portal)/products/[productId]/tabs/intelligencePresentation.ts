import { formatStandingRank } from '@/lib/brandHome/productCategoryStanding'
import type {
  CompareGroupEligible,
  CompareGroupResult,
  MasterIntelligence,
} from '@/lib/productMaster/types'

export type JobStandingView = {
  key: string
  componentId: number | null
  eloLabel: string | null
  eloValue: number | null
  recordLabel: string | null
  rankLabel: string | null
  rankValue: number | null
  rankComparable: boolean
  maturityLabel: string | null
  seedSource: string | null
}

export type HeadToHeadJob = {
  compareGroupId: number
  question: string | null
  setName: string | null
  battleLevelLabel: string | null
  hasResultsFlag: boolean
  standings: JobStandingView[]
}

export type IntelligenceVolumeStat = {
  key: string
  label: string
  value: string
}

export type HeadlineStanding = {
  question: string
  rankLabel: string
  eloLabel: string | null
  recordLabel: string | null
  setName: string | null
}

function finiteNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function formatEloScore(score: unknown): string | null {
  const n = finiteNumber(score)
  if (n == null) return null
  return String(Math.round(n))
}

export function formatBattleRecord(
  battlesWon: unknown,
  battles: unknown
): string | null {
  const won = finiteNumber(battlesWon)
  const total = finiteNumber(battles)
  if (won != null && total != null) {
    if (won >= 0 && total >= 0 && won <= total) {
      return `${Math.trunc(won).toLocaleString()} won · ${Math.trunc(total).toLocaleString()} battles`
    }
    return null
  }
  if (total != null && total >= 0) {
    return `${Math.trunc(total).toLocaleString()} battle${Math.trunc(total) === 1 ? '' : 's'}`
  }
  return null
}

export function formatJobRank(
  rank: unknown,
  pool: unknown,
  comparable: boolean | null | undefined
): string | null {
  if (comparable !== true) return null
  return formatStandingRank(finiteNumber(rank), finiteNumber(pool))
}

export function battleLevelLabel(level: unknown): string | null {
  const n = finiteNumber(level)
  if (n == null || n < 1) return null
  return `Level ${Math.trunc(n)}`
}

function standingFromResult(result: CompareGroupResult, index: number): JobStandingView {
  const componentId = finiteNumber(result.component_id)
  const maturity = finiteNumber(result.maturity)
  const eloValue = finiteNumber(result.elo_score)
  const rankLabel = formatJobRank(result.job_rank, result.job_total, result.rank_comparable)
  return {
    key: `${result.compare_group_id}-${componentId ?? 'na'}-${index}`,
    componentId,
    eloLabel: formatEloScore(result.elo_score),
    eloValue,
    recordLabel: formatBattleRecord(result.battles_won, result.battles),
    rankLabel,
    rankValue: rankLabel ? finiteNumber(result.job_rank) : null,
    rankComparable: result.rank_comparable === true,
    maturityLabel:
      maturity != null ? `Maturity ${maturity.toFixed(2)}` : null,
    seedSource: result.seed_source?.trim() || null,
  }
}

function jobCopy(
  group: Pick<CompareGroupEligible, 'name' | 'consumer_question'>
): { question: string | null; setName: string | null } {
  const question = group.consumer_question?.trim() || null
  const name = group.name?.trim() || null
  const setName = name && name !== question ? name : null
  return { question: question ?? (setName ? null : name), setName }
}

/**
 * Eligible groups are brand-visible. Result rows (Elo, rank, record) are only
 * attached when the RPC returned `compare_groups.results` — admin-only today.
 */
export function buildHeadToHeadJobs(
  eligible: CompareGroupEligible[] | null | undefined,
  results: CompareGroupResult[] | null | undefined
): HeadToHeadJob[] {
  const showScores = results != null
  const groups = Array.isArray(eligible) ? eligible : []
  const rows = showScores && Array.isArray(results) ? results : []

  const byGroup = new Map<number, CompareGroupResult[]>()
  for (const row of rows) {
    const id = finiteNumber(row.compare_group_id)
    if (id == null) continue
    const list = byGroup.get(id) ?? []
    list.push(row)
    byGroup.set(id, list)
  }

  const jobs: HeadToHeadJob[] = groups.map((group) => {
    const { question, setName } = jobCopy(group)
    const groupResults = byGroup.get(group.compare_group_id) ?? []
    byGroup.delete(group.compare_group_id)
    return {
      compareGroupId: group.compare_group_id,
      question,
      setName,
      battleLevelLabel: battleLevelLabel(group.battle_level),
      hasResultsFlag: Boolean(group.has_results),
      standings: groupResults.map(standingFromResult),
    }
  })

  for (const leftover of byGroup.values()) {
    const first = leftover[0]
    if (!first) continue
    const { question, setName } = jobCopy(first)
    jobs.push({
      compareGroupId: first.compare_group_id,
      question,
      setName,
      battleLevelLabel: null,
      hasResultsFlag: true,
      standings: leftover.map(standingFromResult),
    })
  }

  return jobs
}

function standingSortKey(standing: JobStandingView): [number, number] {
  const rank = standing.rankValue ?? Number.POSITIVE_INFINITY
  const elo = standing.eloValue ?? Number.NEGATIVE_INFINITY
  return [rank, -elo]
}

export function pickHeadlineStanding(jobs: HeadToHeadJob[]): HeadlineStanding | null {
  const candidates: { job: HeadToHeadJob; standing: JobStandingView }[] = []
  for (const job of jobs) {
    for (const standing of job.standings) {
      if (standing.rankLabel) candidates.push({ job, standing })
    }
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) => {
    const [ar, ae] = standingSortKey(a.standing)
    const [br, be] = standingSortKey(b.standing)
    if (ar !== br) return ar - br
    return ae - be
  })
  const best = candidates[0]
  const question = best.job.question?.trim() || best.job.setName?.trim()
  if (!question || !best.standing.rankLabel) return null
  return {
    question,
    rankLabel: best.standing.rankLabel,
    eloLabel: best.standing.eloLabel,
    recordLabel: best.standing.recordLabel,
    setName: best.job.setName && best.job.setName !== question ? best.job.setName : null,
  }
}

export function intelligenceVolumeStats(
  intel: MasterIntelligence
): IntelligenceVolumeStat[] {
  if (!intel) return []
  const stats: IntelligenceVolumeStat[] = [
    {
      key: 'raters',
      label: 'Unique raters',
      value: Math.trunc(intel.unique_raters).toLocaleString(),
    },
  ]
  if (intel.total_battles != null) {
    stats.push({
      key: 'battles',
      label: 'Total battles',
      value: Math.trunc(intel.total_battles).toLocaleString(),
    })
  }
  if (intel.taste_score != null) {
    stats.push({
      key: 'taste',
      label: 'Taste (unpublished)',
      value: String(Math.round(intel.taste_score)),
    })
  }
  if (intel.health_score != null) {
    stats.push({
      key: 'health',
      label: 'Health (unpublished)',
      value: String(Math.round(intel.health_score)),
    })
  }
  return stats
}

export function raterFloorCopy(intel: MasterIntelligence): string | null {
  if (!intel) return null
  const have = Math.trunc(intel.unique_raters)
  const need = Math.trunc(intel.min_raters_to_publish)
  if (!Number.isFinite(need) || need < 1) return null
  return `${have.toLocaleString()} of ${need.toLocaleString()} unique raters toward a publishable score`
}

export function jobStatusCopy(job: HeadToHeadJob, showScores: boolean): string | null {
  if (job.standings.length > 0) return null
  if (!showScores && job.hasResultsFlag) {
    return 'This job has battle data. Rankings aren’t published here yet.'
  }
  return 'No standing in this job yet.'
}
