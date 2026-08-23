'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { previewConceptQuestionnaireAction } from '../actions'
import { evaluateFieldValidity } from '@/lib/concept/validity'
import { loadConceptDraftForPreview, snapshotDraft } from '@/lib/concept/preview/loadDraft'
import { combatantsFromDraft } from '@/lib/concept/preview/combatants'
import { signCombatantImages } from '@/lib/concept/preview/signImages'
import { synthesizePlan } from '@/lib/concept/preview/synthesizePlan'
import type { ConceptPlanScreen } from '@/lib/concept/preview/planTypes'
import PreviewRunner from './PreviewRunner'
import './previewRunner.css'

type Props = {
  draftId: string
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'gated'; reasons: string[] }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready'
      screens: ConceptPlanScreen[]
      stimulusMode: string | null
    }

export default function PreviewWalkthroughClient({ draftId }: Props) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const loaded = await loadConceptDraftForPreview(draftId)
      if (cancelled) return
      if (!loaded) {
        setState({ kind: 'missing' })
        return
      }
      const snapshot = snapshotDraft(loaded)
      const validity = evaluateFieldValidity(snapshot)
      if (!validity.readyToPublish) {
        setState({
          kind: 'gated',
          reasons: validity.outstanding.map((o) => o.message).slice(0, 8),
        })
        return
      }
      const result = await previewConceptQuestionnaireAction(snapshot)
      if (cancelled) return
      if (!result.ok) {
        setState({ kind: 'error', message: result.error })
        return
      }
      const signed = await signCombatantImages(combatantsFromDraft(snapshot))
      const screens = synthesizePlan({
        questions: result.questions,
        combatants: signed,
        seed: snapshot.draftId,
        stimulusMode: snapshot.stimulusMode,
        pricePosture: snapshot.pricePosture,
      })
      setState({
        kind: 'ready',
        screens,
        stimulusMode: snapshot.stimulusMode,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [draftId])

  const back = `/studies/concept/${draftId}/edit`

  if (state.kind === 'loading') {
    return (
      <div className="cpw">
        <div className="cpw-gate">
          <p>Building the walkthrough…</p>
        </div>
      </div>
    )
  }

  if (state.kind === 'missing') {
    return (
      <div className="cpw">
        <div className="cpw-gate">
          <h1>Draft not found</h1>
          <p>This concept draft isn&apos;t in this browser, and no server copy loaded.</p>
          <Link className="cpw-back" href="/studies/concept/new">
            New concept study
          </Link>
        </div>
      </div>
    )
  }

  if (state.kind === 'gated') {
    return (
      <div className="cpw">
        <div className="cpw-gate">
          <h1>Finish the study first</h1>
          <p>Walkthrough is available once the draft is ready to publish.</p>
          <ul style={{ textAlign: 'left', margin: '16px auto', maxWidth: 360 }}>
            {state.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <Link className="cpw-back" href={back}>
            Back to the builder
          </Link>
        </div>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="cpw">
        <div className="cpw-error">
          <h1>Couldn&apos;t start the walkthrough</h1>
          <p>{state.message}</p>
          <Link className="cpw-back" href={back}>
            Back to the builder
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cpw">
      <div className="cpw-shell" style={{ paddingBottom: 0 }}>
        <Link className="cpw-back" href={back} style={{ marginBottom: 16 }}>
          ← Back to the builder
        </Link>
      </div>
      <PreviewRunner screens={state.screens} stimulusMode={state.stimulusMode} />
    </div>
  )
}
