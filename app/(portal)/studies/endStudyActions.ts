'use server'

import { revalidatePath } from 'next/cache'
import { getPortalUser } from '@/lib/queries'
import { canPublishStudies } from '@/lib/studies/canPublishStudies'
import {
  endStudyErrorMessage,
  parseEndStudyResult,
  parseStudyEndPreview,
  type EndStudyResult,
  type StudyEndPreview,
} from '@/lib/studies/endStudy'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export type GetStudyEndPreviewResult =
  | { ok: true; preview: StudyEndPreview }
  | { ok: false; error: string }

export type EndStudyActionResult =
  | { ok: true; result: EndStudyResult }
  | { ok: false; error: string }

async function requireEndCaller(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const portalUser = await getPortalUser()
  if (!portalUser) return { ok: false, error: 'Sign in again to continue.' }
  if (!canPublishStudies(portalUser)) {
    return { ok: false, error: 'Only brand admins can end a study.' }
  }
  return { ok: true }
}

function revalidateStudyPaths(missionId: string, kind: string | null) {
  revalidatePath('/studies')
  revalidatePath(`/studies/${missionId}/checkout`)
  if (kind === 'concept') {
    revalidatePath(`/studies/concept/${missionId}/report`)
    revalidatePath(`/studies/concept/${missionId}`)
  } else {
    revalidatePath(`/reports/${missionId}`)
  }
}

export async function getStudyEndPreviewAction(
  missionId: string
): Promise<GetStudyEndPreviewResult> {
  if (!missionId.trim()) return { ok: false, error: 'Missing study id.' }
  const gate = await requireEndCaller()
  if (!gate.ok) return gate
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_study_end_preview', {
    p_mission_id: missionId,
  })
  if (error) return { ok: false, error: endStudyErrorMessage(error) }
  const preview = parseStudyEndPreview(data)
  if (!preview) {
    return { ok: false, error: 'Could not read where this study stands. Try again.' }
  }
  return { ok: true, preview }
}

export async function endStudyAction(missionId: string): Promise<EndStudyActionResult> {
  if (!missionId.trim()) return { ok: false, error: 'Missing study id.' }
  const gate = await requireEndCaller()
  if (!gate.ok) return gate
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('end_study', {
    p_mission_id: missionId,
  })
  if (error) return { ok: false, error: endStudyErrorMessage(error) }
  const result = parseEndStudyResult(data)
  if (!result) {
    return { ok: false, error: 'Could not end this study. Try again.' }
  }
  revalidateStudyPaths(missionId, result.kind)
  return { ok: true, result }
}
