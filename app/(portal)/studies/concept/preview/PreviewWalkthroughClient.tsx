'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { previewConceptJourneyAction } from '@/app/(portal)/studies/concept/actions'
import { combatantsFromDraft } from '@/lib/concept/preview/combatants'
import { loadConceptDraftForPreview, snapshotDraft } from '@/lib/concept/preview/loadDraft'
import { screensFromJourney } from '@/lib/concept/preview/screensFromJourney'
import { signCombatantImages } from '@/lib/concept/preview/signImages'
import type { ConceptPlanScreen } from '@/lib/concept/preview/planTypes'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import type { PreviewCombatant } from '@/lib/concept/preview/combatants'
import PreviewRunner from './PreviewRunner'
import './previewRunner.css'

type Ready = {
  draft: ConceptStudyDraft
  screens: ConceptPlanScreen[]
  combatants: PreviewCombatant[]
  note: string | null
}

/**
 * Respondent phone walkthrough. The builder keeps the journey outline;
 * Preview opens this.
 */
export default function PreviewWalkthroughClient({ draftId }: { draftId?: string }) {
  const params = useParams()
  const id =
    draftId ??
    (typeof params?.missionId === 'string'
      ? params.missionId
      : typeof params?.draftId === 'string'
        ? params.draftId
        : null)
  const editHref = id ? `/studies/concept/${id}/edit` : '/studies'
  const [ready, setReady] = useState<Ready | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Open Preview from the study.')
      return
    }
    let cancelled = false
    ;(async () => {
      const loaded = await loadConceptDraftForPreview(id)
      if (cancelled) return
      if (!loaded) {
        setError('This draft is not on this browser. Open it from the editor and try Preview again.')
        return
      }
      const draft = snapshotDraft(loaded)
      const journey = await previewConceptJourneyAction(draft)
      if (cancelled) return
      const preview = journey.preview
      if (!preview) {
        setError(journey.ok ? 'Preview came back empty.' : journey.error)
        return
      }
      const signed = await signCombatantImages(combatantsFromDraft(draft))
      if (cancelled) return
      const walked = screensFromJourney({
        journey: preview,
        combatants: signed,
        seed: draft.draftId || id,
        stimulusMode: draft.stimulusMode,
      })
      setReady({
        draft,
        screens: walked.screens,
        combatants: walked.combatants,
        note: journey.ok
          ? null
          : 'Live journey preview was unavailable, so this walkthrough is the sample journey for your designs.',
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
        stimulusMode={ready.draft.stimulusMode}
        seed={ready.draft.draftId || id || 'preview'}
        editHref={editHref}
        draft={ready.draft}
        combatants={ready.combatants}
      />
    </div>
  )
}
