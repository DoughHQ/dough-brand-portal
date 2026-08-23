'use client'

/**
 * Hydrate a server study_drafts row into localStorage and return the edit URL.
 * Server remains source of truth; local cache is write-through for same-machine edit.
 */

import { getStudyDraftAction } from '@/app/(portal)/studies/drafts/actions'
import { createEmptyBoxDraft } from '@/lib/box/defaults'
import { normalizeStoredBoxDraft, saveBoxDraft } from '@/lib/box/draftStore'
import type { BoxStudyDraft } from '@/lib/box/types'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import { saveConceptDraft } from '@/lib/concept/draftStore'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { bindServerDraftId } from '@/lib/studies/draftServerBindings'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

export async function openServerStudyDraft(args: {
  serverDraftId: string
  effectiveBrandId: number
}): Promise<{ ok: true; href: string } | { ok: false; error: string }> {
  const result = await getStudyDraftAction(args.serverDraftId)
  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  const json = asRecord(result.draft.draft_json)
  if (!json) {
    return { ok: false, error: 'Draft data was invalid.' }
  }

  const testType = result.draft.test_type
  if (testType === 'concept') {
    const merged = {
      ...createEmptyConceptDraft({ brandId: args.effectiveBrandId }),
      ...json,
      brandId: args.effectiveBrandId,
    } as ConceptStudyDraft
    const saved = saveConceptDraft(merged)
    bindServerDraftId(saved.draftId, result.draft.id)
    return { ok: true, href: `/studies/concept/${saved.draftId}/edit` }
  }

  if (testType === 'ihut') {
    const merged = normalizeStoredBoxDraft(
      {
        ...createEmptyBoxDraft(args.effectiveBrandId),
        ...json,
        brandId: args.effectiveBrandId,
      } as Partial<BoxStudyDraft>,
      args.effectiveBrandId
    )
    const saved = saveBoxDraft(merged)
    bindServerDraftId(saved.draftId, result.draft.id)
    return { ok: true, href: `/studies/box/${saved.draftId}/edit` }
  }

  return { ok: false, error: 'Unknown study type.' }
}
