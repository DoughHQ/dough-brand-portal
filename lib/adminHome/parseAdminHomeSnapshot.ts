/**
 * Parse get_admin_home_snapshot() jsonb into AdminHomeSnapshot.
 * Pure — unit-tested with fixtures. Hrefs for studies are built here (RPC returns ids/labels).
 */
import type {
  AdminCorrectionNext,
  AdminHomePulse,
  AdminHomeQueues,
  AdminHomeSnapshot,
  AdminStudyHighlight,
} from './types'

const EMPTY_PULSE: AdminHomePulse = {
  users: 0,
  users7d: 0,
  battles: 0,
  battles7d: 0,
  scans7d: 0,
  brandsCatalog: 0,
  brandsClaimed: 0,
  brandsVerified: 0,
  productsCatalog: 0,
  productsWithElo: 0,
}

const EMPTY_QUEUES: AdminHomeQueues = {
  corrections: { count: 0, approveAsIs: 0, oldestAt: null, next: null },
  ownership: { count: 0, oldestAt: null, next: null },
  applications: { pending: 0, exceptions: 0, oldestAt: null, next: null },
  boxes: { attention: 0, next: null },
}

const EMPTY_READINESS = {
  sellable: 0,
  approaching: 0,
  building: 0,
  nearMiss: null,
} as const

export const EMPTY_ADMIN_HOME_SNAPSHOT: AdminHomeSnapshot = {
  generatedAt: new Date(0).toISOString(),
  catalogRefreshedAt: null,
  pulse: EMPTY_PULSE,
  queues: EMPTY_QUEUES,
  readiness: { ...EMPTY_READINESS },
  studies: { live: 0, highlight: null },
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

function asNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function asStr(v: unknown): string | null {
  if (v == null) return null
  const s = String(v)
  return s.length > 0 ? s : null
}

function studyHrefFromRpc(
  kind: AdminStudyHighlight['kind'],
  id: string,
  missionType: string | null
): string {
  const isConcept = missionType === 'concept_test'
  if (kind === 'results') {
    return isConcept ? `/studies/concept/${id}/report` : `/reports/${id}`
  }
  return isConcept ? `/studies/concept/${id}` : `/studies`
}

function parseCorrectionNext(raw: unknown): AdminCorrectionNext | null {
  const r = asRecord(raw)
  if (!r) return null
  const id = asStr(r.id)
  const productId = asNum(r.product_id)
  const createdAt = asStr(r.created_at)
  if (!id || !createdAt || !Number.isFinite(productId) || productId <= 0) return null
  return {
    id,
    productId,
    name: asStr(r.name) || `Product ${productId}`,
    brand: asStr(r.brand),
    type: asStr(r.type),
    createdAt,
  }
}

function parseQueues(raw: unknown): AdminHomeQueues {
  const q = asRecord(raw)
  if (!q) return EMPTY_QUEUES

  const corr = asRecord(q.corrections)
  const own = asRecord(q.ownership)
  const apps = asRecord(q.applications)
  const boxes = asRecord(q.boxes)

  const appNext = asRecord(apps?.next)
  const ownNext = asRecord(own?.next)
  const boxNext = asRecord(boxes?.next)

  return {
    corrections: {
      count: asNum(corr?.count),
      approveAsIs: 0,
      oldestAt: asStr(corr?.oldest_at),
      next: parseCorrectionNext(corr?.next),
    },
    ownership: {
      count: asNum(own?.count),
      oldestAt: asStr(own?.oldest_at),
      next:
        ownNext && asStr(ownNext.id)
          ? {
              id: asStr(ownNext.id)!,
              brandName: asStr(ownNext.label) || 'Brand',
              createdAt: asStr(ownNext.created_at),
            }
          : null,
    },
    applications: {
      pending: asNum(apps?.count),
      exceptions: asNum(apps?.exceptions),
      oldestAt: asStr(apps?.oldest_at),
      next:
        appNext && asStr(appNext.id) && asStr(appNext.created_at)
          ? {
              id: asStr(appNext.id)!,
              name: asStr(appNext.label) || 'Application',
              createdAt: asStr(appNext.created_at)!,
              exception: Boolean(appNext.exception),
            }
          : null,
    },
    boxes: {
      attention: asNum(boxes?.count),
      next:
        boxNext && asStr(boxNext.id) && asStr(boxNext.created_at)
          ? {
              id: asStr(boxNext.id)!,
              title: asStr(boxNext.label) || 'Box',
              status: asStr(boxNext.status) || 'shipping',
              createdAt: asStr(boxNext.created_at)!,
            }
          : null,
    },
  }
}

function parsePulse(raw: unknown): AdminHomePulse {
  const p = asRecord(raw)
  if (!p) return EMPTY_PULSE
  return {
    users: asNum(p.users),
    users7d: asNum(p.users_7d),
    battles: asNum(p.battles),
    battles7d: asNum(p.battles_7d),
    scans7d: asNum(p.scans_7d),
    brandsCatalog: asNum(p.brands_catalog),
    brandsClaimed: asNum(p.brands_claimed),
    brandsVerified: asNum(p.brands_verified),
    productsCatalog: asNum(p.products_catalog),
    productsWithElo: asNum(p.products_with_elo),
  }
}

function parseHighlight(raw: unknown): AdminStudyHighlight | null {
  const h = asRecord(raw)
  if (!h) return null
  const kindRaw = asStr(h.kind)
  if (kindRaw !== 'stuck' && kindRaw !== 'results' && kindRaw !== 'live') return null
  const id = asStr(h.id)
  const title = asStr(h.title)
  const detail = asStr(h.detail)
  if (!id || !title || !detail) return null
  return {
    kind: kindRaw,
    title,
    detail,
    href: studyHrefFromRpc(kindRaw, id, asStr(h.mission_type)),
  }
}

export function parseAdminHomeSnapshot(raw: unknown, fallbackGeneratedAt = new Date()): AdminHomeSnapshot {
  const root = asRecord(raw)
  if (!root) {
    return {
      ...EMPTY_ADMIN_HOME_SNAPSHOT,
      generatedAt: fallbackGeneratedAt.toISOString(),
    }
  }

  const studies = asRecord(root.studies)

  return {
    generatedAt: asStr(root.generated_at) || fallbackGeneratedAt.toISOString(),
    catalogRefreshedAt: asStr(root.catalog_refreshed_at),
    pulse: parsePulse(root.pulse),
    queues: parseQueues(root.queues),
    readiness: { ...EMPTY_READINESS },
    studies: {
      live: asNum(studies?.live_count),
      highlight: parseHighlight(studies?.highlight),
    },
  }
}

export function badgesFromSnapshot(snapshot: AdminHomeSnapshot) {
  return {
    corrections: snapshot.queues.corrections.count,
    ownership: snapshot.queues.ownership.count,
    applications: snapshot.queues.applications.pending,
    boxes: snapshot.queues.boxes.attention,
  }
}
