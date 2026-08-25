export const READINESS_STATUSES = [
  'empty',
  'building',
  'approaching',
  'sellable',
] as const

export type ReadinessStatus = (typeof READINESS_STATUSES)[number]

export type ReadinessRow = {
  nodeId: number
  l1Name: string | null
  name: string
  battles: number
  distinctRaters: number
  productsBattled: number
  raters7d: number
  raters30d: number
  studyBattlesExcluded: number
  compareGroupBattles: number
  /** Mapped for tests/debug. Never rendered — do not put next to the gauge. */
  compareGroupRaters: number
  lastBattleAt: string | null
  raterThreshold: number
  status: ReadinessStatus | string
}

export function isReadinessStatus(value: string): value is ReadinessStatus {
  return (READINESS_STATUSES as readonly string[]).includes(value)
}

export function countByStatus(rows: ReadinessRow[]): Record<ReadinessStatus, number> {
  const counts: Record<ReadinessStatus, number> = {
    empty: 0,
    building: 0,
    approaching: 0,
    sellable: 0,
  }
  for (const row of rows) {
    if (isReadinessStatus(row.status)) counts[row.status] += 1
  }
  return counts
}

export function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 14) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function intelligenceL2Href(l2Name: string): string {
  return `/admin/categories/${encodeURIComponent(l2Name)}`
}

export function intelligenceL3Href(l2Name: string, l3Name: string): string {
  return `/admin/categories/${encodeURIComponent(l2Name)}/${encodeURIComponent(l3Name)}`
}

export function readinessL3Href(l2NodeId: number): string {
  return `/admin/categories/${l2NodeId}/readiness`
}

/** Hide-empty: nothing to look at. Status may still be `empty` when leftovers exist. */
export function isHideableEmpty(row: ReadinessRow): boolean {
  return (
    row.distinctRaters === 0 &&
    row.compareGroupBattles === 0 &&
    row.studyBattlesExcluded === 0
  )
}

export function studyBattlesCaption(n: number): string | null {
  if (n <= 0) return null
  return `${n.toLocaleString()} study battle${n === 1 ? '' : 's'} not counted`
}

export function compareGroupBattlesCaption(n: number): string | null {
  if (n <= 0) return null
  return `${n.toLocaleString()} compare-group battle${n === 1 ? '' : 's'} — different question, not in this ranking.`
}
