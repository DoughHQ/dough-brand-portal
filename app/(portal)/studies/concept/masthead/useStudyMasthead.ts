'use client'

import { useMemo } from 'react'
import { buildMastheadModel } from '@/lib/concept/studyMasthead'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { focusMastheadSeat, requestMastheadAdd } from './mastheadActions'

export function useStudyMasthead(
  draft: ConceptStudyDraft,
  locked: boolean,
  onOpenField: () => void,
) {
  const model = useMemo(() => buildMastheadModel(draft), [draft])
  const showVs =
    !model.empty &&
    model.arms.length > 0 &&
    (model.products.length > 0 || model.addCompetitor != null)

  return {
    model,
    showVs,
    requestAdd: (action: 'add-design' | 'add-competitor') =>
      requestMastheadAdd(action, locked, onOpenField),
    focusSeat: (focusId: string) => focusMastheadSeat(focusId, onOpenField),
  }
}
