'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export type MissionTrashResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; code?: 'PARENT_CAMPAIGN_WITHDRAWN' | 'NOT_EMPTY' | 'NOT_WITHDRAWN' | 'UNKNOWN' }

function classifyError(message: string): MissionTrashResult {
  if (message.startsWith('PARENT_CAMPAIGN_WITHDRAWN')) {
    return { ok: false, error: message, code: 'PARENT_CAMPAIGN_WITHDRAWN' }
  }
  if (message.startsWith('NOT_EMPTY')) {
    return {
      ok: false,
      error:
        "Studies with responses can't be permanently deleted; they can stay withdrawn.",
      code: 'NOT_EMPTY',
    }
  }
  if (message.startsWith('NOT_WITHDRAWN')) {
    return {
      ok: false,
      error: 'Only withdrawn studies can be permanently deleted.',
      code: 'NOT_WITHDRAWN',
    }
  }
  return { ok: false, error: message, code: 'UNKNOWN' }
}

export async function withdrawMissionAction(missionId: string): Promise<MissionTrashResult> {
  if (!missionId) return { ok: false, error: 'Missing mission id', code: 'UNKNOWN' }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('withdraw_mission', {
    p_mission_id: missionId,
  })

  if (error) return classifyError(error.message)
  return { ok: true, message: 'Moved to withdrawn' }
}

export async function restoreMissionAction(missionId: string): Promise<MissionTrashResult> {
  if (!missionId) return { ok: false, error: 'Missing mission id', code: 'UNKNOWN' }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('restore_mission', {
    p_mission_id: missionId,
  })

  if (error) return classifyError(error.message)
  return { ok: true, message: 'Restored' }
}

export async function hardDeleteMissionAction(missionId: string): Promise<MissionTrashResult> {
  if (!missionId) return { ok: false, error: 'Missing mission id', code: 'UNKNOWN' }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('hard_delete_mission', {
    p_mission_id: missionId,
  })

  if (error) return classifyError(error.message)
  return { ok: true, message: 'Permanently deleted' }
}
