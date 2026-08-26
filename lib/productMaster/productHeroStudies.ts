import {
  studyBadge,
  studyHref,
  studyProgress,
} from '@/lib/brandHome/selectHomeModel'
import type { OperatorStudyRow } from '@/lib/studies/types'

export type ProductStudyCard = {
  missionId: string
  title: string
  typeLabel: string
  badge: string
  progressDetail: string
  progressPct: number | null
  href: string
  ctaLabel: string
  /** False only when the RPC says the session brand co-sponsors and does not own the campaign. */
  isCampaignOwner: boolean
}

function finiteId(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Hero for this catalog product: mission focal id matches.
 * Concept studies often leave `focal_product_id` null — those need the
 * combatant-aware RPC, not this client filter.
 */
export function isHeroStudyForProduct(
  row: Pick<OperatorStudyRow, 'focal_product_id' | 'lifecycle_state'>,
  productId: number
): boolean {
  if (row.lifecycle_state === 'draft') return false
  const focal = finiteId(row.focal_product_id)
  return focal != null && focal === productId
}

export function typeBadgeLabel(row: Pick<OperatorStudyRow, 'test_type' | 'mission_type'>): string {
  if (row.test_type === 'concept') return 'Concept'
  if (row.test_type === 'ihut') return 'iHUT'
  if (row.mission_type === 'concept_test') return 'Concept'
  if (row.mission_type === 'product_discovery') return 'iHUT'
  return 'Study'
}

export function toProductStudyCards(
  rows: OperatorStudyRow[],
  productId: number,
  opts?: { alreadyHeroScoped?: boolean }
): ProductStudyCard[] {
  const scoped = opts?.alreadyHeroScoped
    ? rows.filter((row) => row.lifecycle_state !== 'draft')
    : rows.filter((row) => isHeroStudyForProduct(row, productId))

  return scoped.map((row) => {
    const { href, ctaLabel } = studyHref(row)
    const { detail, progress } = studyProgress(row)
    return {
      missionId: row.mission_id,
      title: row.title?.trim() || 'Untitled study',
      typeLabel: typeBadgeLabel(row),
      badge: studyBadge(row.lifecycle_state),
      progressDetail: detail,
      progressPct: progress,
      href,
      ctaLabel,
      isCampaignOwner: row.is_campaign_owner !== false,
    }
  })
}
