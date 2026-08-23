'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Json } from '@/lib/database.types'

export type StudyDraftTestType = 'concept' | 'ihut'

export type StudyDraftRow = {
  id: string
  brand_id: number
  test_type: string
  title: string | null
  draft_json: Json
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  expires_at: string
}

export type StudyDraftListItem = {
  id: string
  test_type: string
  title: string | null
  updated_by: string
  updated_at: string
  created_at: string
  expires_at: string
}

function extractHint(error: {
  message?: string
  hint?: string
}): string | null {
  if (typeof error.hint === 'string' && error.hint.trim()) return error.hint.trim()
  const msg = error.message ?? ''
  for (const code of [
    'INVALID_TEST_TYPE',
    'DRAFT_JSON_NOT_OBJECT',
    'NOT_A_BRAND_PORTAL_USER',
    'CROSS_TENANT_ACCESS_DENIED',
  ]) {
    if (msg.includes(code)) return code
  }
  return null
}

function humanize(hint: string | null, fallback: string): string {
  switch (hint) {
    case 'INVALID_TEST_TYPE':
      return 'That study type is not supported.'
    case 'DRAFT_JSON_NOT_OBJECT':
      return 'Draft data was invalid. Try again.'
    case 'NOT_A_BRAND_PORTAL_USER':
      return "You don't have access to save drafts."
    case 'CROSS_TENANT_ACCESS_DENIED':
      return "You don't have access to that draft."
    default:
      return fallback
  }
}

/**
 * Create or update a study wizard draft. Never pass p_brand_id —
 * tenancy is stamped server-side for brand users.
 */
export async function upsertStudyDraftAction(args: {
  testType: StudyDraftTestType
  title: string | null
  draftJson: Record<string, unknown>
  draftId?: string | null
}): Promise<
  { ok: true; draft: StudyDraftRow } | { ok: false; error: string; hint: string | null }
> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('upsert_study_draft', {
    p_test_type: args.testType,
    p_title: args.title?.trim() ? args.title.trim() : undefined,
    p_draft_json: args.draftJson as Json,
    p_draft_id: args.draftId ?? undefined,
  })

  if (error) {
    const hint = extractHint(error)
    return {
      ok: false,
      error: humanize(hint, error.message || 'Could not save draft.'),
      hint,
    }
  }

  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Could not save draft.', hint: null }
  }

  return { ok: true, draft: data as StudyDraftRow }
}

export async function listStudyDraftsAction(): Promise<
  | { ok: true; drafts: StudyDraftListItem[] }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_study_drafts')
  if (error) {
    return { ok: false, error: error.message || 'Could not list drafts.' }
  }
  return { ok: true, drafts: (data ?? []) as StudyDraftListItem[] }
}

export async function getStudyDraftAction(
  draftId: string
): Promise<
  | { ok: true; draft: StudyDraftRow }
  | { ok: false; error: string; hint: string | null }
> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('study_drafts')
    .select(
      'id, brand_id, test_type, title, draft_json, created_by, updated_by, created_at, updated_at, expires_at'
    )
    .eq('id', draftId)
    .maybeSingle()

  if (error) {
    const hint = extractHint(error)
    return {
      ok: false,
      error: humanize(hint, error.message || 'Could not load draft.'),
      hint,
    }
  }
  if (!data) {
    return { ok: false, error: 'Draft not found.', hint: null }
  }
  return { ok: true, draft: data as StudyDraftRow }
}

export async function deleteStudyDraftAction(
  draftId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('delete_study_draft', {
    p_draft_id: draftId,
  })
  if (error) {
    return {
      ok: false,
      error: humanize(extractHint(error), error.message || 'Could not delete draft.'),
    }
  }
  return { ok: true }
}

/** Rename a draft in place — keeps draft_json, updates title only. */
export async function renameStudyDraftAction(args: {
  draftId: string
  testType: StudyDraftTestType
  title: string
}): Promise<{ ok: true } | { ok: false; error: string; hint: string | null }> {
  const title = args.title.trim()
  if (!title) {
    return { ok: false, error: 'Enter a title.', hint: null }
  }

  const existing = await getStudyDraftAction(args.draftId)
  if (!existing.ok) {
    return { ok: false, error: existing.error, hint: existing.hint }
  }

  const json = existing.draft.draft_json
  if (json == null || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, error: 'Draft data was invalid.', hint: 'DRAFT_JSON_NOT_OBJECT' }
  }

  const nextJson = {
    ...(json as Record<string, unknown>),
    title,
  }

  const result = await upsertStudyDraftAction({
    testType: args.testType,
    title,
    draftJson: nextJson,
    draftId: args.draftId,
  })
  if (!result.ok) return result
  return { ok: true }
}
