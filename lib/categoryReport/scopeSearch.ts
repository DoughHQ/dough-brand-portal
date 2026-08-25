import { CATEGORY_SCOPES, type CategoryScope } from './types'

export type ScopeSearchHit = {
  scope: CategoryScope
  scopeId: number
  name: string
  parentName: string
  distinctRaters: number
  raterThreshold: number
  status: string
}

export const SCOPE_CHIP_LABEL: Record<CategoryScope, string> = {
  l2: 'L2',
  l3: 'L3',
  compare_group: 'Compare group',
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '')
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function parseScope(raw: string): CategoryScope | null {
  return (CATEGORY_SCOPES as readonly string[]).includes(raw) ? (raw as CategoryScope) : null
}

export function parseScopeSearchHit(raw: unknown): ScopeSearchHit | null {
  const o = asObject(raw)
  if (!o) return null
  const scope = parseScope(asString(o.scope).trim())
  const scopeId = asNumber(o.scope_id)
  const name = asString(o.name).trim()
  if (!scope || scopeId == null || !Number.isSafeInteger(scopeId) || scopeId <= 0 || !name) {
    return null
  }
  return {
    scope,
    scopeId,
    name,
    parentName: asString(o.parent_name).trim(),
    distinctRaters: asNumber(o.distinct_raters) ?? 0,
    raterThreshold: asNumber(o.rater_threshold) ?? 0,
    status: asString(o.status).trim() || 'empty',
  }
}

export function parseScopeSearchRows(data: unknown): ScopeSearchHit[] {
  if (!Array.isArray(data)) return []
  const hits: ScopeSearchHit[] = []
  for (const row of data) {
    const hit = parseScopeSearchHit(row)
    if (hit) hits.push(hit)
  }
  return hits
}
