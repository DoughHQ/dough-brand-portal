'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export type CloseStudyResult =
  | {
      ok: true
      message: string
      inFlightStopped: number
      wasAlready: boolean
    }
  | {
      ok: false
      error: string
      code?: 'NOT_AUTHORIZED' | 'NOT_RUNNABLE' | 'UNKNOWN'
    }

function classifyError(message: string): CloseStudyResult {
  if (message.startsWith('NOT_AUTHORIZED') || message.includes('NOT_AUTHORIZED')) {
    return {
      ok: false,
      error: 'Only Dough admins can close a study.',
      code: 'NOT_AUTHORIZED',
    }
  }
  if (message.startsWith('NOT_RUNNABLE') || message.includes('NOT_RUNNABLE')) {
    return {
      ok: false,
      error: 'Only active or paused studies can be closed.',
      code: 'NOT_RUNNABLE',
    }
  }
  return { ok: false, error: message, code: 'UNKNOWN' }
}

/**
 * close_study — hard-error RPC (admin-only). Raises on real faults.
 */
export async function closeStudyAction(missionId: string): Promise<CloseStudyResult> {
  if (!missionId) return { ok: false, error: 'Missing mission id', code: 'UNKNOWN' }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('close_study', {
    p_mission_id: missionId,
  })

  if (error) return classifyError(error.message)

  const row =
    data != null && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null

  const inFlightStopped =
    typeof row?.in_flight_stopped === 'number' && Number.isFinite(row.in_flight_stopped)
      ? row.in_flight_stopped
      : 0
  const wasAlready = row?.was_already === true

  const message =
    inFlightStopped > 0
      ? `Study closed. ${inFlightStopped} in-progress ${
          inFlightStopped === 1 ? 'response was' : 'responses were'
        } stopped.`
      : wasAlready
        ? 'Study was already closed.'
        : 'Study closed.'

  return { ok: true, message, inFlightStopped, wasAlready }
}
