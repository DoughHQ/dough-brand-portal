/**
 * Correction desk — inbox law.
 * Queue is pending work. Focus is a cursor. Apply never navigates.
 */

export type CorrectionsDeskSearch = {
  focusId: string | null
  /** Set only for an explicit product filter (no case cursor). */
  productFilterId: number | null
}

function firstParam(raw: string | string[] | null | undefined): string | null {
  if (raw == null) return null
  const v = Array.isArray(raw) ? raw[0] : raw
  const t = v.trim()
  return t === '' ? null : t
}

/**
 * `?focus=` pins a row inside the global queue.
 * `?product=` is a filter only when there is no focus — so Admin Home
 * `?product=x&focus=y` bookmarks open the desk, not a one-SKU trap.
 */
export function parseCorrectionsDeskSearch(
  params: Record<string, string | string[] | undefined> | null | undefined
): CorrectionsDeskSearch {
  const focusId = firstParam(params?.focus)
  const productRaw = firstParam(params?.product)
  const productId =
    productRaw && Number.isFinite(Number(productRaw)) ? Number(productRaw) : null
  return {
    focusId,
    productFilterId: focusId ? null : productId,
  }
}

export function correctionsDeskHref(opts?: {
  focusId?: string | null
  productFilterId?: number | null
}): string {
  const params = new URLSearchParams()
  if (opts?.productFilterId != null && !opts.focusId) {
    params.set('product', String(opts.productFilterId))
  }
  if (opts?.focusId) params.set('focus', opts.focusId)
  const q = params.toString()
  return q ? `/admin/corrections?${q}` : '/admin/corrections'
}

export function initialFocusIndex<T extends { id: string }>(
  rows: T[],
  focusId: string | null
): number {
  if (!focusId || rows.length === 0) return 0
  const idx = rows.findIndex((r) => r.id === focusId)
  return idx >= 0 ? idx : 0
}

/** Stale `?focus=` must not silently open a different product. */
export function missingFocusNotice<T extends { id: string }>(
  rows: T[],
  focusId: string | null
): string | null {
  if (!focusId) return null
  if (rows.some((r) => r.id === focusId)) return null
  if (rows.length === 0) return 'That case is no longer pending.'
  return 'That case is no longer pending. Showing the next one in the queue.'
}

export type DeskQueue<T extends { id: string }> = {
  rows: T[]
  focusIndex: number
}

export type DeskQueueAction<T extends { id: string }> =
  | { type: 'drop'; id: string }
  | { type: 'openRelated'; row: T }
  | { type: 'append'; incoming: T[] }
  | { type: 'patch'; id: string; patch: Partial<T> }
  | { type: 'focus'; index: number }

/**
 * Every queue mutation goes through here so apply cannot clobber a prefetch
 * that landed while the RPC was in flight.
 */
export function reduceDeskQueue<T extends { id: string }>(
  state: DeskQueue<T>,
  action: DeskQueueAction<T>
): DeskQueue<T> {
  switch (action.type) {
    case 'drop':
      return removeAndAdvance(state.rows, action.id)
    case 'openRelated': {
      const focusId = state.rows[state.focusIndex]?.id ?? null
      return insertAfterFocus(state.rows, focusId, action.row)
    }
    case 'append': {
      const rows = mergeUniqueById(state.rows, action.incoming)
      if (rows.length === 0) return { rows, focusIndex: 0 }
      return { rows, focusIndex: Math.min(state.focusIndex, rows.length - 1) }
    }
    case 'patch':
      return {
        rows: state.rows.map((row) =>
          row.id === action.id ? { ...row, ...action.patch } : row
        ),
        focusIndex: state.focusIndex,
      }
    case 'focus': {
      if (state.rows.length === 0) return { rows: state.rows, focusIndex: 0 }
      return {
        rows: state.rows,
        focusIndex: Math.max(0, Math.min(action.index, state.rows.length - 1)),
      }
    }
  }
}

/** After a successful apply/reject: drop the row, keep the list order, land on what was next. */
export function removeAndAdvance<T extends { id: string }>(
  rows: T[],
  removedId: string
): { rows: T[]; focusIndex: number } {
  const idx = rows.findIndex((r) => r.id === removedId)
  const next = rows.filter((r) => r.id !== removedId)
  if (next.length === 0) return { rows: next, focusIndex: 0 }
  if (idx < 0) return { rows: next, focusIndex: 0 }
  return { rows: next, focusIndex: Math.min(idx, next.length - 1) }
}

export function mergeUniqueById<T extends { id: string }>(prev: T[], incoming: T[]): T[] {
  const seen = new Set(prev.map((r) => r.id))
  const merged = [...prev]
  for (const row of incoming) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    merged.push(row)
  }
  return merged
}

/**
 * Open a related claim without leaving the desk.
 * If it is already in the loaded page, focus it. Otherwise insert it after the open case.
 */
export function insertAfterFocus<T extends { id: string }>(
  rows: T[],
  focusId: string | null,
  row: T
): { rows: T[]; focusIndex: number } {
  const existing = rows.findIndex((r) => r.id === row.id)
  if (existing >= 0) return { rows, focusIndex: existing }
  const at = focusId ? rows.findIndex((r) => r.id === focusId) : -1
  const next = [...rows]
  const insertAt = at < 0 ? 0 : at + 1
  next.splice(insertAt, 0, row)
  return { rows: next, focusIndex: insertAt }
}

/** Same-SKU claims: loaded queue first, then extras from the product fetch. */
export function relatedClaims<T extends { id: string; product_id: number }>(
  focused: T,
  queue: T[],
  fetched: T[]
): T[] {
  const local = queue.filter((r) => r.product_id === focused.product_id && r.id !== focused.id)
  const seen = new Set([focused.id, ...local.map((r) => r.id)])
  const extras = fetched.filter(
    (r) => r.product_id === focused.product_id && !seen.has(r.id)
  )
  return [...local, ...extras]
}

export function isAlreadyHandledError(message: string | null | undefined): boolean {
  if (!message) return false
  return /not pending/i.test(message)
}

/** Shareable cursor. Does not trigger a Next navigation or RSC refetch. */
export function replaceDeskCursor(opts: {
  focusId: string | null
  productFilterId: number | null
}): void {
  if (typeof window === 'undefined') return
  const next = correctionsDeskHref({
    focusId: opts.focusId,
    productFilterId: opts.productFilterId,
  })
  const current = `${window.location.pathname}${window.location.search}`
  if (current === next) return
  window.history.replaceState(window.history.state, '', next)
}
