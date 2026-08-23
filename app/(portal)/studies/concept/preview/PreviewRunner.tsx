'use client'

import { useMemo, useState } from 'react'
import type {
  ConceptBattleOutcome,
  ConceptPlanScreen,
  ConceptPlanSubject,
} from '@/lib/concept/preview/planTypes'
import {
  isBattleKind,
  isConceptChoiceKind,
} from '@/lib/concept/preview/planTypes'
import {
  applyBattleWin,
  emptyWinTally,
  mostChosenCombatantRef,
  winnerRefForOutcome,
} from '@/lib/concept/preview/sessionWins'
import BattleScreen from './BattleScreen'
import ChoiceScreen from './ChoiceScreen'
import ProgressHeader from './ProgressHeader'
import { buildRecap, type RecapLine } from '@/lib/concept/preview/recap'
import SummaryScreen from './SummaryScreen'

export type { RecapLine }

type BattleRecord = {
  outcome: ConceptBattleOutcome
  refA: number
  refB: number
}

type Props = {
  screens: ConceptPlanScreen[]
  stimulusMode: string | null
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

export default function PreviewRunner({ screens, stimulusMode }: Props) {
  const [index, setIndex] = useState(0)
  const [battles, setBattles] = useState<Map<number, BattleRecord>>(new Map())
  const [tally, setTally] = useState(emptyWinTally)
  const [choiceLines, setChoiceLines] = useState<RecapLine[]>([])
  const [sawBattleNote, setSawBattleNote] = useState(false)

  const screen = screens[index]
  const names = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of screens) {
      if (isBattleKind(s.kind)) {
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

  const recap = buildRecap({
    screens,
    battleWins: tally,
    battleTotal,
    combatantNames: names,
    choiceLines,
    mostChosen,
  })

  function advance() {
    setIndex((cur) => nextIndex(screens, cur, battles))
  }

  function onBattle(outcome: ConceptBattleOutcome) {
    if (!screen || !isBattleKind(screen.kind)) return
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

  function subjectCard(ref: number): ConceptPlanSubject {
    for (const s of screens) {
      if (isBattleKind(s.kind)) {
        for (const side of [s.combatant_a, s.combatant_b]) {
          if (side?.ref === ref) {
            return {
              ref,
              name: side.name,
              brand: side.brand,
              image_url: side.image_url,
              price: side.price,
              kind: side.kind,
            }
          }
        }
      }
    }
    return {
      ref,
      name: names.get(ref) ?? `Option ${ref}`,
      brand: null,
      image_url: null,
      price: null,
    }
  }

  function resolveSubject(): ConceptPlanSubject | null {
    if (!screen || !isConceptChoiceKind(screen.kind)) {
      return screen && 'subject' in screen ? (screen.subject ?? null) : null
    }
    if (screen.resolve_subject === 'client_session_winner') {
      if (mostChosen == null) return null
      return subjectCard(mostChosen)
    }
    return screen.subject ?? null
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

        {isBattleKind(screen.kind) ? (
          <BattleScreen
            screen={screen}
            stimulusMode={stimulusMode}
            showOrderNote={!sawBattleNote}
            onOutcome={onBattle}
          />
        ) : null}

        {isConceptChoiceKind(screen.kind) ? (
          <ChoiceScreen
            screen={screen}
            subject={resolveSubject()}
            onAnswer={(_values, labels) => {
              const about =
                resolveSubject()?.name != null
                  ? ` (${resolveSubject()!.name})`
                  : ''
              setChoiceLines((cur) => [
                ...cur,
                {
                  text: `${screen.label ?? screen.kind}${about}: ${labels.join(', ')}`,
                },
              ])
              advance()
            }}
          />
        ) : null}

        {screen.kind === 'attribute_followup' ? (
          <ChoiceScreen
            screen={screen}
            subject={(() => {
              const rec = battles.get(screen.linked_round_number)
              const winner =
                rec != null
                  ? winnerRefForOutcome(rec.outcome, rec.refA, rec.refB)
                  : null
              if (winner == null) return null
              return {
                ref: winner,
                name: names.get(winner) ?? `Option ${winner}`,
                brand: null,
                image_url: null,
                price: null,
              }
            })()}
            onAnswer={(_values, labels) => {
              setChoiceLines((cur) => [
                ...cur,
                { text: `Why this one: ${labels.join(', ')}` },
              ])
              advance()
            }}
          />
        ) : null}

        {screen.kind === 'session_summary' ? (
          <SummaryScreen lines={recap} />
        ) : null}
      </div>
    </div>
  )
}
