import { getStudyDraftAction } from '@/app/(portal)/studies/drafts/actions'
import { getConceptDraft } from '@/lib/concept/draftStore'
import { normalizeDraft } from '@/lib/concept/normalizeDraft'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import { getBoundServerDraftId } from '@/lib/studies/draftServerBindings'
import type { ConceptStudyDraft } from '@/lib/concept/types'

function fromJson(json: unknown, brandId?: number): ConceptStudyDraft | null {
  if (json == null || typeof json !== 'object' || Array.isArray(json)) return null
  return normalizeDraft({
    ...createEmptyConceptDraft(brandId != null ? { brandId } : {}),
    ...(json as ConceptStudyDraft),
  })
}

/**
 * Local draft first, then the bound server row, then the URL id as a server id.
 * Snapshot the result — do not keep reading live storage while walking.
 */
export async function loadConceptDraftForPreview(
  draftId: string
): Promise<ConceptStudyDraft | null> {
  const local = getConceptDraft(draftId)
  if (local) return normalizeDraft(local)

  const bound = getBoundServerDraftId(draftId)
  if (bound) {
    const row = await getStudyDraftAction(bound)
    if (row.ok) {
      const hydrated = fromJson(row.draft.draft_json, row.draft.brand_id)
      if (hydrated) return hydrated
    }
  }

  const direct = await getStudyDraftAction(draftId)
  if (direct.ok) {
    return fromJson(direct.draft.draft_json, direct.draft.brand_id)
  }
  return null
}

export function snapshotDraft(draft: ConceptStudyDraft): ConceptStudyDraft {
  return structuredClone(draft)
}
