import { createServerSupabaseClient } from '@/lib/supabase-server'
import { parseConceptTestEnvelope } from '@/lib/conceptReport/conceptTestTypes'

export async function tryParseConceptTest(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  missionId: string,
) {
  const { data } = await supabase.rpc('get_concept_mission_report', {
    p_mission_id: missionId,
  })
  return parseConceptTestEnvelope(data)
}
