import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import {
  endStudyErrorMessage,
  parseStudyEndPreview,
  type StudyEndPreview,
} from './endStudy'

export async function loadStudyEndPreview(
  supabase: SupabaseClient<Database>,
  missionId: string
): Promise<{ ok: true; preview: StudyEndPreview } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('get_study_end_preview', {
    p_mission_id: missionId,
  })
  if (error) return { ok: false, error: endStudyErrorMessage(error) }
  const preview = parseStudyEndPreview(data)
  if (!preview) {
    return { ok: false, error: 'Could not read where this study stands.' }
  }
  return { ok: true, preview }
}
