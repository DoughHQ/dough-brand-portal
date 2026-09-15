export type AdminQueueBadges = {
  corrections: number
  ownership: number
  applications: number
  boxes: number
}

export type AdminCorrectionNext = {
  id: string
  productId: number
  name: string
  brand: string | null
  type: string | null
  createdAt: string
}

export type AdminHomeQueues = {
  corrections: {
    count: number
    /** Always 0 on Home until a stored approve-as-is flag exists. */
    approveAsIs: number
    oldestAt: string | null
    next: AdminCorrectionNext | null
  }
  ownership: {
    count: number
    oldestAt: string | null
    next: { id: string; brandName: string; createdAt: string | null } | null
  }
  applications: {
    pending: number
    exceptions: number
    oldestAt: string | null
    next: { id: string; name: string; createdAt: string; exception: boolean } | null
  }
  boxes: {
    attention: number
    next: { id: string; title: string; status: string; createdAt: string } | null
  }
}

export type AdminReadinessSnapshot = {
  sellable: number
  approaching: number
  building: number
  nearMiss: {
    name: string
    raters: number
    threshold: number
    href: string
  } | null
}

export type AdminStudyHighlight = {
  kind: 'stuck' | 'results' | 'live'
  title: string
  detail: string
  href: string
}

/** Pulse fields from get_admin_home_snapshot — no avg_decision_ms. */
export type AdminHomePulse = {
  users: number
  users7d: number
  battles: number
  battles7d: number
  scans7d: number
  brandsCatalog: number
  brandsClaimed: number
  brandsVerified: number
  productsCatalog: number
  productsWithElo: number
}

export type AdminHomeSnapshot = {
  generatedAt: string
  catalogRefreshedAt: string | null
  pulse: AdminHomePulse
  queues: AdminHomeQueues
  readiness: AdminReadinessSnapshot
  studies: {
    live: number
    highlight: AdminStudyHighlight | null
  }
}

export type AdminAttentionTone = 'work' | 'stale'

export type AdminAttentionRow = {
  key: 'corrections' | 'ownership' | 'applications' | 'boxes'
  label: string
  href: string
  count: number
  detail: string
  nextLabel: string | null
  tone: AdminAttentionTone
}

export type AdminPulseCell = {
  key: string
  label: string
  value: string
  sub: string
  href?: string
  warn?: boolean
}

export type AdminHomeModel = {
  greeting: string
  generatedAt: string
  caughtUp: boolean
  attentionTotal: number
  attention: AdminAttentionRow[]
  pulse: AdminPulseCell[]
  readiness: AdminReadinessSnapshot & { href: string }
  research: {
    liveCount: number
    highlight: AdminStudyHighlight | null
    studiesHref: string
    newHref: string
  }
}
