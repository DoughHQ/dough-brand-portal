'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function refreshMissionReportAction(
  missionId: string
): Promise<{ refreshed: true }> {
  const userSupabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await userSupabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.rpc('refresh_brand_mission_report', {
    p_mission_id: missionId,
  })
  if (error) {
    throw new Error(error.message)
  }

  return { refreshed: true }
}
