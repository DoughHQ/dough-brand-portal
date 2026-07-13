import type { SupabaseClient } from '@supabase/supabase-js'
import { parseExperiencedEnvelope } from './parse'
import type { ExperiencedReportLoadResult } from './types'

function unwrapPayload(data: unknown): Record<string, unknown> | null {
  if (data == null) return null
  if (typeof data === 'string') {
    try {
      return unwrapPayload(JSON.parse(data) as unknown)
    } catch {
      return null
    }
  }
  if (typeof data !== 'object' || Array.isArray(data)) return null
  return data as Record<string, unknown>
}

/**
 * Read-only via get_experienced_mission_report.
 * Never calls freeze/refresh/mission_brand_report.
 */
export async function fetchExperiencedMissionReport(
  supabase: SupabaseClient,
  missionId: string
): Promise<ExperiencedReportLoadResult> {
  const { data, error } = await supabase.rpc('get_experienced_mission_report' as never, {
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

  if (status === 'not_ready') return { ok: false, code: 'NO_REPORT_YET' }
  if (status === 'forbidden') return { ok: false, code: 'FORBIDDEN' }

  if (status !== 'ok' && !payload.report && !payload.headline_win_rate) {
    if (typeof payload.error === 'string') {
      const err = payload.error.toUpperCase()
      if (err.includes('NO_REPORT') || err.includes('NOT_READY')) {
        return { ok: false, code: 'NO_REPORT_YET' }
      }
      if (err === 'FORBIDDEN') return { ok: false, code: 'FORBIDDEN' }
    }
    return {
      ok: false,
      code: 'FETCH_ERROR',
      detail: status ? `Unexpected status: ${status}` : 'Malformed RPC response',
    }
  }

  const envelope = parseExperiencedEnvelope(payload, missionId)
  if (!envelope) {
    return {
      ok: false,
      code: 'FETCH_ERROR',
      detail: 'Report payload is incomplete or malformed.',
    }
  }

  return { ok: true, envelope }
}

/** Seeded simulated missions for admin preview. */
export const EXPERIENCED_PREVIEW_MISSIONS = {
  competitive_map: '612e596a-1008-46f6-b1aa-817518f93b83',
  value_sensitivity: '091de839-7458-438d-9b86-e8e4a99829c9',
  head_to_head_loyalty: '123b998a-7fed-4dd6-ae85-e775c8bd0aa9',
} as const
