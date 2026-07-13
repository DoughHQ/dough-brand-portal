import type { SupabaseClient } from '@supabase/supabase-js'
import { parseConceptMissionReport } from './parse'
import type { ConceptReportLoadResult } from './types'

function unwrapPayload(data: unknown): Record<string, unknown> | null {
  if (data == null) return null
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown
      return unwrapPayload(parsed)
    } catch {
      return null
    }
  }
  if (typeof data !== 'object' || Array.isArray(data)) return null
  return data as Record<string, unknown>
}

/**
 * Read-only load via production get_concept_mission_report.
 * Branches on status: ok | not_ready | forbidden.
 * Never calls compute — refresh is a separate operator action.
 */
export async function fetchConceptMissionReport(
  supabase: SupabaseClient,
  missionId: string
): Promise<ConceptReportLoadResult> {
  const { data, error } = await supabase.rpc('get_concept_mission_report' as never, {
    p_mission_id: missionId,
  } as never)

  if (error) {
    const msg = error.message ?? 'Could not load report'
    if (/not authenticated|jwt|auth/i.test(msg)) {
      return { ok: false, code: 'NOT_AUTHENTICATED', detail: msg }
    }
    return { ok: false, code: 'FETCH_ERROR', detail: msg }
  }

  const payload = unwrapPayload(data)
  if (!payload) {
    return { ok: false, code: 'NO_REPORT_YET' }
  }

  const status = typeof payload.status === 'string' ? payload.status.toLowerCase() : null

  if (status === 'not_ready') {
    return { ok: false, code: 'NO_REPORT_YET' }
  }
  if (status === 'forbidden') {
    return { ok: false, code: 'FORBIDDEN' }
  }

  // Production ok envelope, or payload that already carries the frozen fields.
  const looksLikeReport =
    status === 'ok' ||
    Array.isArray(payload.win_rate_field) ||
    payload.finding != null

  if (!looksLikeReport) {
    if (typeof payload.error === 'string') {
      const err = payload.error.toUpperCase()
      if (err.includes('NO_REPORT') || err.includes('NOT_READY')) {
        return { ok: false, code: 'NO_REPORT_YET' }
      }
      if (err === 'FORBIDDEN') return { ok: false, code: 'FORBIDDEN' }
      if (err === 'NOT_AUTHENTICATED') return { ok: false, code: 'NOT_AUTHENTICATED' }
      if (err === 'NOT_A_PORTAL_USER') return { ok: false, code: 'NOT_A_PORTAL_USER' }
    }
    return {
      ok: false,
      code: 'FETCH_ERROR',
      detail: status ? `Unexpected status: ${status}` : 'Malformed RPC response',
    }
  }

  const report = parseConceptMissionReport(payload, { missionId })
  if (!report) {
    return {
      ok: false,
      code: 'FETCH_ERROR',
      detail: 'Report payload is incomplete or malformed.',
    }
  }

  return { ok: true, report }
}
