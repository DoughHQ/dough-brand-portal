/**
 * Categories the brand does not compete in, adjacent to ones it does.
 * Count-less by design — never attach product/battle/entitled fields.
 */
export type AdjacentCategory = {
  l2_id: number
  l2_name: string
  l1_name: string | null
  banner_image_url: string | null
  icon_name: string | null
}

export type RpcErrorFields = {
  code: string | null
  message: string | null
  details: string | null
  hint: string | null
}

export type AdjacentCategoriesResult =
  | { ok: true; rows: AdjacentCategory[]; allRowsUnparsed?: number }
  | { ok: false; rows: []; error: RpcErrorFields }

function textOrNull(value: unknown): string | null {
  if (value == null || value === '') return null
  return String(value)
}

export function rpcErrorFields(error: unknown): RpcErrorFields {
  if (error == null) {
    return { code: null, message: null, details: null, hint: null }
  }
  if (typeof error !== 'object') {
    return { code: null, message: String(error), details: null, hint: null }
  }
  const o = error as Record<string, unknown>
  const fromProto = error instanceof Error ? error.message : null
  return {
    code: textOrNull(o.code),
    message: textOrNull(fromProto) ?? textOrNull(o.message),
    details: textOrNull(o.details),
    hint: textOrNull(o.hint),
  }
}

function asAdjacent(raw: unknown): AdjacentCategory | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const l2Id = Number(o.l2_id)
  if (!Number.isFinite(l2Id) || l2Id <= 0) return null
  return {
    l2_id: Math.trunc(l2Id),
    l2_name: String(o.l2_name ?? `Category ${l2Id}`),
    l1_name: o.l1_name == null || o.l1_name === '' ? null : String(o.l1_name),
    banner_image_url:
      o.banner_image_url == null || o.banner_image_url === ''
        ? null
        : String(o.banner_image_url),
    icon_name: o.icon_name == null || o.icon_name === '' ? null : String(o.icon_name),
  }
}

function adjacentArray(data: unknown): unknown[] | null {
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null
  const adjacent = (row as Record<string, unknown>).adjacent
  return Array.isArray(adjacent) ? adjacent : null
}

/**
 * Preserve RPC order. Skip invalid rows. Never invent counts.
 * Accepts `{ adjacent: [...] }` or a one-element PostgREST array envelope.
 */
export function parseBrandAdjacentCategories(data: unknown): AdjacentCategory[] {
  return toAdjacentCategoriesResult(data, null).rows
}

const INVALID_ENVELOPE: RpcErrorFields = {
  code: 'invalid_envelope',
  message: 'unparseable adjacent envelope',
  details: null,
  hint: null,
}

/**
 * Maps a supabase rpc (data, error) pair. Pure — no I/O.
 * Empty success is ok: true. Transport/envelope failure is ok: false.
 * A valid adjacent array with length > 0 that parses to zero rows is still
 * ok: true for the UI (omit the section) but sets allRowsUnparsed so callers
 * can log schema drift.
 */
export function toAdjacentCategoriesResult(
  data: unknown,
  error: unknown
): AdjacentCategoriesResult {
  if (error) {
    return { ok: false, rows: [], error: rpcErrorFields(error) }
  }
  const raw = adjacentArray(data)
  if (raw == null) {
    return { ok: false, rows: [], error: INVALID_ENVELOPE }
  }
  const rows = raw.map(asAdjacent).filter((r): r is AdjacentCategory => r != null)
  if (raw.length > 0 && rows.length === 0) {
    return { ok: true, rows: [], allRowsUnparsed: raw.length }
  }
  return { ok: true, rows }
}
