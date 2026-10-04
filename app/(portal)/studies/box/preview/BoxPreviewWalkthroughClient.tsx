'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { previewIhutJourneyAction } from '@/app/(portal)/studies/box/actions'
import { loadBoxDraft } from '@/lib/box/draftStore'
import {
  combatantsFromBoxDraft,
  screensFromIhutJourney,
} from '@/lib/box/preview/screensFromIhutJourney'
import type { BoxStudyDraft } from '@/lib/box/types'
import { createEmptyConceptDraft, newConceptArm } from '@/lib/concept/defaults'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import type { ConceptPlanScreen } from '@/lib/concept/preview/planTypes'
import type { PreviewCombatant } from '@/lib/concept/preview/combatants'
import PreviewRunner from '../../concept/preview/PreviewRunner'
import '../../concept/preview/previewRunner.css'

type Ready = {
  draft: BoxStudyDraft
  conceptShim: ConceptStudyDraft
  screens: ConceptPlanScreen[]
  combatants: PreviewCombatant[]
  note: string | null
}

function conceptShimFromBox(
  draft: BoxStudyDraft,
  combatants: PreviewCombatant[]
): ConceptStudyDraft {
  const base = createEmptyConceptDraft({ brandId: draft.brandId })
  return {
    ...base,
    draftId: draft.draftId,
    title: draft.title,
    conceptArms: combatants.map((c, i) => ({
      ...newConceptArm(i),
      localId: `seat_${c.ref}`,
      display_name: c.name,
      image_url: c.image_url,
      frozen_price: c.price != null ? String(c.price) : null,
      battle_intent: i === 0 ? 'hero' : 'competitor',
    })),
    products: [],
  }
}

export default function BoxPreviewWalkthroughClient({
  draftId,
}: {
  draftId?: string
}) {
  const params = useParams()
  const id =
    draftId ??
    (typeof params?.draftId === 'string' ? params.draftId : null)
  const editHref = id ? `/studies/box/${id}/edit` : '/studies'
  const [ready, setReady] = useState<Ready | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Open Preview from the study.')
      return
    }
    let cancelled = false
    ;(async () => {
      const draft = loadBoxDraft(id)
      if (cancelled) return
      if (!draft) {
        setError(
          'This draft is not on this browser. Open it from the editor and try Preview again.'
        )
        return
      }
      const journey = await previewIhutJourneyAction(draft)
      if (cancelled) return
      if (!journey.preview) {
        setError(journey.ok ? 'Preview came back empty.' : journey.error)
        return
      }
      const combatants = combatantsFromBoxDraft(draft)
      if (combatants.length < 2) {
        setError('Add at least two products to the field before previewing.')
        return
      }
      const walked = screensFromIhutJourney({
        journey: journey.preview,
        combatants,
        seed: draft.draftId || id,
      })
      setReady({
        draft,
        conceptShim: conceptShimFromBox(draft, combatants),
        screens: walked.screens,
        combatants: walked.combatants,
        note: journey.preview.note ?? (journey.ok ? null : journey.error),
      })
    })().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Preview failed')
      }
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <div className="cpw">
        <div className="cpw-shell">
          <h1 className="cpw-prompt">{error}</h1>
          <Link href={editHref}>← Back to editor</Link>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="cpw">
        <div className="cpw-shell">
          <p className="cpw-help">Opening the respondent walkthrough…</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="cpw-shell" style={{ paddingBottom: 0 }}>
        <Link href={editHref}>← Back to editor</Link>
        {ready.note ? <p className="cpw-help">{ready.note}</p> : null}
      </div>
      <PreviewRunner
        screens={ready.screens}
        stimulusMode={null}
        seed={ready.draft.draftId || id || 'preview'}
        editHref={editHref}
        draft={ready.conceptShim}
        combatants={ready.combatants}
      />
    </div>
  )
}
