import { relativeTime, countByStatus, intelligenceL2Href, isReadinessStatus } from '@/lib/categoryReadiness.shared'
import { studyHref } from '@/lib/brandHome/selectHomeModel'
import type { OperatorStudyRow } from '@/lib/studies/types'
import type { ReadinessRow } from '@/lib/categoryReadiness.shared'
import type {
  AdminAttentionRow,
  AdminHomeModel,
  AdminHomeQueues,
  AdminHomeSnapshot,
  AdminPulseCell,
  AdminReadinessSnapshot,
  AdminStudyHighlight,
} from './types'

const STALE_MS = 7 * 24 * 60 * 60 * 1000
const STUCK_STUDY_MS = 3 * 24 * 60 * 60 * 1000

const TYPE_LABELS: Record<string, string> = {
  name: 'name',
  brand: 'brand',
  category: 'category',
  ingredients: 'ingredients',
  nutrition_facts: 'nutrition',
  allergens: 'allergens',
  price: 'price',
  product_image: 'image',
  other: 'other',
}

const ATTENTION_ORDER: AdminAttentionRow['key'][] = [
  'corrections',
  'applications',
  'ownership',
  'boxes',
]

export function adminGreeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function isStale(iso: string | null | undefined, now: Date): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return false
  return now.getTime() - t >= STALE_MS
}

function fmt(n: number): string {
  return n.toLocaleString()
}

function agePhrase(iso: string | null | undefined): string | null {
  const label = relativeTime(iso ?? null)
  if (!label) return null
  if (label === 'just now') return 'just now'
  return label
}

function typeLabel(raw: string | null | undefined): string | null {
  if (!raw) return null
  const key = raw.toLowerCase()
  return TYPE_LABELS[key] ?? key.replace(/_/g, ' ')
}

export function correctionNextLabel(next: AdminHomeQueues['corrections']['next']): string | null {
  if (!next) return null
  const product = next.name.trim() || 'Untitled product'
  const brand = next.brand?.trim()
  const type = typeLabel(next.type)
  const parts = [brand, product, type].filter((p): p is string => Boolean(p))
  return parts.join(' · ')
}

function joinDetail(parts: Array<string | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p && p.trim())).join(' · ')
}

function oldestClause(iso: string | null | undefined): string | null {
  const age = agePhrase(iso)
  if (!age) return null
  if (age === 'just now') return 'Just in'
  return `Oldest ${age}`
}

export function buildAttention(queues: AdminHomeQueues, now: Date): AdminAttentionRow[] {
  const rows: AdminAttentionRow[] = []

  if (queues.corrections.count > 0) {
    const oldest = oldestClause(queues.corrections.oldestAt)
    const ready =
      queues.corrections.approveAsIs > 0
        ? `${fmt(queues.corrections.approveAsIs)} ready to approve as-is`
        : null
    rows.push({
      key: 'corrections',
      label: 'Corrections',
      href: queues.corrections.next
        ? `/admin/corrections?product=${queues.corrections.next.productId}&focus=${queues.corrections.next.id}`
        : '/admin/corrections',
      count: queues.corrections.count,
      detail: joinDetail([ready, oldest]) || 'Pending human review',
      nextLabel: correctionNextLabel(queues.corrections.next),
      tone: isStale(queues.corrections.oldestAt, now) ? 'stale' : 'work',
    })
  }

  if (queues.applications.pending > 0) {
    const oldest = oldestClause(queues.applications.oldestAt)
    const exceptions =
      queues.applications.exceptions > 0
        ? `${fmt(queues.applications.exceptions)} need a call`
        : null
    rows.push({
      key: 'applications',
      label: 'Applications',
      href: '/admin/brand-applications',
      count: queues.applications.pending,
      detail: joinDetail([exceptions, oldest]) || 'Brand signup queue',
      nextLabel: queues.applications.next?.name ?? null,
      tone: isStale(queues.applications.oldestAt, now) ? 'stale' : 'work',
    })
  }

  if (queues.ownership.count > 0) {
    rows.push({
      key: 'ownership',
      label: 'Ownership',
      href: '/admin/ownership-corrections',
      count: queues.ownership.count,
      detail: oldestClause(queues.ownership.oldestAt) || 'Brand parent corrections',
      nextLabel: queues.ownership.next?.brandName ?? null,
      tone: isStale(queues.ownership.oldestAt, now) ? 'stale' : 'work',
    })
  }

  if (queues.boxes.attention > 0) {
    const status = queues.boxes.next?.status
      ? boxStatusPhrase(queues.boxes.next.status)
      : 'Fulfillment ops'
    rows.push({
      key: 'boxes',
      label: 'Boxes',
      href: queues.boxes.next ? `/admin/boxes/${queues.boxes.next.id}` : '/admin/boxes?tab=live',
      count: queues.boxes.attention,
      detail: status,
      nextLabel: queues.boxes.next?.title ?? null,
      tone: 'work',
    })
  }

  return rows.sort((a, b) => {
    if (a.tone === 'stale' && b.tone !== 'stale') return -1
    if (b.tone === 'stale' && a.tone !== 'stale') return 1
    return ATTENTION_ORDER.indexOf(a.key) - ATTENTION_ORDER.indexOf(b.key)
  })
}

function boxStatusPhrase(status: string): string {
  if (status === 'shipping') return 'In shipping'
  if (status === 'open') return 'Open for claims'
  if (status === 'running') return 'Running'
  return status.replace(/_/g, ' ')
}

export function buildPulse(snapshot: Pick<AdminHomeSnapshot, 'pulse'>): AdminPulseCell[] {
  const { pulse } = snapshot
  const usersWarn = pulse.users >= 20 && pulse.users7d <= 1

  const brandSubParts = [
    `${fmt(pulse.brandsCatalog)} in catalog`,
    pulse.brandsVerified > 0 ? `${fmt(pulse.brandsVerified)} domain-verified` : null,
  ]

  const scanBit = pulse.scans7d > 0 ? `${fmt(pulse.scans7d)} scans this week` : null

  return [
    {
      key: 'users',
      label: 'Users',
      value: fmt(pulse.users),
      sub: `${fmt(pulse.users7d)} active this week`,
      warn: usersWarn,
    },
    {
      key: 'battles',
      label: 'Battles',
      value: fmt(pulse.battles),
      sub:
        joinDetail([`${fmt(pulse.battles7d)} this week`, scanBit]) ||
        `${fmt(pulse.battles7d)} this week`,
    },
    {
      key: 'brands',
      label: 'Claimed brands',
      value: fmt(pulse.brandsClaimed),
      sub: joinDetail(brandSubParts) || 'In catalog',
      href: '/admin/impersonate',
    },
    {
      key: 'products',
      label: 'Products',
      value: fmt(pulse.productsCatalog),
      sub:
        pulse.productsWithElo > 0
          ? `${fmt(pulse.productsWithElo)} with Elo`
          : 'In catalog',
      href: '/products',
    },
  ]
}

export function summarizeReadiness(rows: ReadinessRow[]): AdminReadinessSnapshot {
  const counts = countByStatus(rows)
  return {
    sellable: counts.sellable,
    approaching: counts.approaching,
    building: counts.building,
    nearMiss: pickNearMiss(rows),
  }
}

export function pickNearMiss(rows: ReadinessRow[]): AdminReadinessSnapshot['nearMiss'] {
  const candidates = rows.filter((row) => {
    if (!isReadinessStatus(row.status)) return false
    if (row.status === 'sellable' || row.status === 'empty') return false
    if (row.raterThreshold <= 0 || row.distinctRaters <= 0) return false
    return row.distinctRaters < row.raterThreshold
  })
  if (candidates.length === 0) return null
  candidates.sort((a, b) => {
    const da = a.raterThreshold - a.distinctRaters
    const db = b.raterThreshold - b.distinctRaters
    if (da !== db) return da - db
    return b.distinctRaters - a.distinctRaters
  })
  const row = candidates[0]
  return {
    name: row.name,
    raters: row.distinctRaters,
    threshold: row.raterThreshold,
    href: intelligenceL2Href(row.name),
  }
}

export function pickStudyHighlight(
  studies: OperatorStudyRow[],
  now: Date
): { live: number; highlight: AdminStudyHighlight | null } {
  const live = studies.filter((s) => s.lifecycle_state === 'active' || s.lifecycle_state === 'scheduled')
  const stuck = live.filter((s) => {
    if ((s.total_claims ?? 0) > 0) return false
    const created = new Date(s.created_at).getTime()
    return Number.isFinite(created) && now.getTime() - created >= STUCK_STUDY_MS
  })
  if (stuck[0]) {
    const row = stuck[0]
    const { href } = studyHref(row)
    return {
      live: live.length,
      highlight: {
        kind: 'stuck',
        title: row.title,
        detail: `Live with no claims · ${agePhrase(row.created_at) ?? 'opened'}`,
        href,
      },
    }
  }
  const ready = studies.filter(
    (s) => s.lifecycle_state === 'completed' || s.lifecycle_state === 'expired'
  )
  if (ready[0]) {
    const row = ready[0]
    const { href } = studyHref(row)
    return {
      live: live.length,
      highlight: {
        kind: 'results',
        title: row.title,
        detail: row.lifecycle_state === 'completed' ? 'Results ready' : 'Expired — report available',
        href,
      },
    }
  }
  if (live[0]) {
    const row = live[0]
    const { href } = studyHref(row)
    const claimed = row.completed_claims
    const target = row.target_completions
    const detail =
      target != null && target > 0
        ? `${fmt(claimed)} / ${fmt(target)} completions`
        : `${fmt(row.total_claims)} claimed`
    return {
      live: live.length,
      highlight: {
        kind: 'live',
        title: row.title,
        detail,
        href,
      },
    }
  }
  return { live: 0, highlight: null }
}

export function selectAdminHomeModel(
  snapshot: AdminHomeSnapshot,
  now = new Date()
): AdminHomeModel {
  const attention = buildAttention(snapshot.queues, now)
  const attentionTotal = attention.reduce((sum, row) => sum + row.count, 0)
  const studies = snapshot.studies

  return {
    greeting: adminGreeting(now),
    generatedAt: snapshot.generatedAt,
    caughtUp: attention.length === 0,
    attentionTotal,
    attention,
    pulse: buildPulse(snapshot),
    readiness: {
      ...snapshot.readiness,
      href: '/admin/categories',
    },
    research: {
      liveCount: studies.live,
      highlight: studies.highlight,
      studiesHref: '/studies',
      newHref: '/studies/new',
    },
  }
}
