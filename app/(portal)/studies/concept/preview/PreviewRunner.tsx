'use client'

import { useMemo, useState } from 'react'
import type {
  ConceptBattleOutcome,
  ConceptPlanScreen,
  ConceptPlanSubject,
} from '@/lib/concept/preview/planTypes'
import {
  isBattleKind,
  isBattleScreen,
  isConceptChoiceScreen,
} from '@/lib/concept/preview/planTypes'
import {
  applyBattleWin,
  emptyWinTally,
  mostChosenCombatantRef,
  winnerRefForOutcome,
} from '@/lib/concept/preview/sessionWins'
import { resolveFocalSubject } from '@/lib/concept/preview/resolveFocalSubject'
import {
  buildRecap,
  humanRecapTitle,
  subjectFromPlan,
  type RecapAnswer,
} from '@/lib/concept/preview/recap'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import type { PreviewCombatant } from '@/lib/concept/preview/combatants'
import { sampleReportFromDraft } from '@/lib/concept/preview/sampleReport'
import BattleScreen from './BattleScreen'
import ChoiceScreen from './ChoiceScreen'
import ProgressHeader from './ProgressHeader'
import SampleReportScreen from './SampleReportScreen'
import SummaryScreen from './SummaryScreen'

type BattleRecord = {
  outcome: ConceptBattleOutcome
  refA: number
  refB: number
}

type Step = 'walk' | 'sample_report'

type Props = {
  screens: ConceptPlanScreen[]
  stimulusMode: string | null
  seed: string
  editHref: string
  draft: ConceptStudyDraft
  combatants: PreviewCombatant[]
}

function nextIndex(
  screens: ConceptPlanScreen[],
  from: number,
  battles: Map<number, BattleRecord>
): number {
  let i = from + 1
  while (i < screens.length) {
    const s = screens[i]
    if (s?.kind === 'attribute_followup') {
      const rec = battles.get(s.linked_round_number)
      const winner =
        rec != null
          ? winnerRefForOutcome(rec.outcome, rec.refA, rec.refB)
          : null
      if (winner == null) {
        i += 1
        continue
      }
    }
    return i
  }
  return screens.length
}

export default function PreviewRunner({
  screens,
  stimulusMode,
  seed,
  editHref,
  draft,
  combatants,
}: Props) {
  const [index, setIndex] = useState(0)
  const [step, setStep] = useState<Step>('walk')
  const [battles, setBattles] = useState<Map<number, BattleRecord>>(new Map())
  const [tally, setTally] = useState(emptyWinTally)
  const [answers, setAnswers] = useState<RecapAnswer[]>([])
  const [sawBattleNote, setSawBattleNote] = useState(false)

  const sampleReport = useMemo(
    () => sampleReportFromDraft(draft, combatants),
    [draft, combatants]
  )

  const screen = screens[index]
  const names = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of screens) {
      if (isBattleScreen(s)) {
        if (s.combatant_a) map.set(s.combatant_a.ref, s.combatant_a.name)
        if (s.combatant_b) map.set(s.combatant_b.ref, s.combatant_b.name)
      }
      if ('subject' in s && s.subject?.ref != null) {
        map.set(s.subject.ref, s.subject.name ?? `Option ${s.subject.ref}`)
      }
    }
    return map
  }, [screens])

  const mostChosen = mostChosenCombatantRef(tally)
  const battleTotal = screens.filter((s) => isBattleKind(s.kind)).length

  const { byRef, conceptRefs, recapSubjects } = useMemo(() => {
    const map = new Map<number, ConceptPlanSubject>()
    const concepts: number[] = []
    for (const s of screens) {
      if (isBattleScreen(s)) {
        for (const side of [s.combatant_a, s.combatant_b]) {
          if (!side) continue
          map.set(side.ref, {
            ref: side.ref,
            name: side.name,
            brand: side.brand,
            image_url: side.image_url,
            image_unavailable: side.image_unavailable,
            price: side.price,
            kind: side.kind,
          })
          if (side.kind === 'concept' && !concepts.includes(side.ref)) {
            concepts.push(side.ref)
          }
        }
      }
      if ('subject' in s && s.subject?.ref != null) {
        map.set(s.subject.ref, s.subject)
        if (s.subject.kind === 'concept' && !concepts.includes(s.subject.ref)) {
          concepts.push(s.subject.ref)
        }
      }
    }
    concepts.sort((a, b) => a - b)
    const recapSubjects = new Map(
      [...map.entries()].map(([ref, s]) => [ref, subjectFromPlan(s)!])
    )
    return { byRef: map, conceptRefs: concepts, recapSubjects }
  }, [screens])

  const recap = buildRecap({
    battleWins: tally,
    battleTotal,
    mostChosen,
    subjects: recapSubjects,
    answers,
  })

  function advance() {
    setIndex((cur) => nextIndex(screens, cur, battles))
  }

  function onBattle(outcome: ConceptBattleOutcome) {
    if (!screen || !isBattleScreen(screen)) return
    const rec = {
      outcome,
      refA: screen.combatant_ref_a,
      refB: screen.combatant_ref_b,
    }
    const nextBattles = new Map(battles)
    nextBattles.set(screen.round_number, rec)
    setBattles(nextBattles)
    setTally((t) =>
      applyBattleWin(t, outcome, screen.combatant_ref_a, screen.combatant_ref_b)
    )
    setSawBattleNote(true)
    setIndex((cur) => nextIndex(screens, cur, nextBattles))
  }

  const choiceSubject = useMemo(() => {
    if (!screen || !isConceptChoiceScreen(screen) || screen.kind === 'screener') {
      return null
    }
    return resolveFocalSubject({
      screen,
      tally,
      byRef,
      conceptRefs,
      seed,
    })
  }, [screen, tally, byRef, conceptRefs, seed])

  const followupSubject = useMemo(() => {
    if (!screen || screen.kind !== 'attribute_followup') return null
    const rec = battles.get(screen.linked_round_number)
    const winner =
      rec != null ? winnerRefForOutcome(rec.outcome, rec.refA, rec.refB) : null
    if (winner == null) return null
    return (
      byRef.get(winner) ?? {
        ref: winner,
        name: names.get(winner) ?? `Option ${winner}`,
        brand: null,
        image_url: null,
        price: null,
      }
    )
  }, [screen, battles, byRef, names])

  if (step === 'sample_report') {
    return (
      <div className="cpw">
        <SampleReportScreen
          report={sampleReport}
          editHref={editHref}
          onBackToRecap={() => setStep('walk')}
        />
      </div>
    )
  }

  if (!screen) {
    return (
      <div className="cpw-gate">
        <h1>Walkthrough finished</h1>
      </div>
    )
  }

  return (
    <div className="cpw">
      <div className="cpw-shell">
        <p className="cpw-banner">
          This is a preview of the respondent experience. Your answers are not
          recorded and do not affect any study.
        </p>
        <ProgressHeader current={index + 1} total={screens.length} />

        {isBattleScreen(screen) ? (
          <BattleScreen
            screen={screen}
            stimulusMode={stimulusMode}
            showOrderNote={!sawBattleNote}
            onOutcome={onBattle}
          />
        ) : null}

        {isConceptChoiceScreen(screen) ? (
          <ChoiceScreen
            key={screen.screen}
            screen={screen}
            subject={choiceSubject}
            onAnswer={(_values, labels) => {
              const kind = screen.kind === 'screener' ? 'screener' : 'reaction'
              setAnswers((cur) => [
                ...cur,
                {
                  kind,
                  title: humanRecapTitle({
                    label: screen.label,
                    prompt: screen.config?.prompt,
                    fallback: screen.kind,
                  }),
                  values: labels,
                  subject: kind === 'screener' ? null : subjectFromPlan(choiceSubject),
                },
              ])
              advance()
            }}
          />
        ) : null}

        {screen.kind === 'attribute_followup' ? (
          <ChoiceScreen
            key={screen.screen}
            screen={screen}
            subject={followupSubject}
            onAnswer={(_values, labels) => {
              setAnswers((cur) => [
                ...cur,
                {
                  kind: 'followup',
                  title: humanRecapTitle({
                    label: screen.label,
                    prompt: screen.config?.prompt,
                    fallback: 'Why this one',
                  }),
                  values: labels,
                  subject: subjectFromPlan(followupSubject),
                },
              ])
              advance()
            }}
          />
        ) : null}

        {screen.kind === 'session_summary' ? (
          <SummaryScreen
            recap={recap}
            editHref={editHref}
            onSeeSample={() => setStep('sample_report')}
          />
        ) : null}
      </div>
    </div>
  )
}
