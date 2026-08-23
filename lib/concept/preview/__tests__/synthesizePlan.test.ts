import { describe, expect, it } from 'vitest'
import type { ConceptStudyDraft } from '../../types'
import { createEmptyConceptDraft } from '../../defaults'
import { combatantsFromDraft } from '../combatants'
import { sampledWhyRounds } from '../md5'
import { parsePreviewQuestionnaire, DEACTIVATED_BRAND_MESSAGE } from '../parsePreview'
import { isBattleKind, type ProtocolQuestion } from '../planTypes'
import { synthesizePlan } from '../synthesizePlan'
import { applyBattleWin, emptyWinTally, mostChosenCombatantRef } from '../sessionWins'
import { buildRecap } from '../recap'

function arm(i: number, image: string | null = `concept-stimuli/${i}.png`) {
  return {
    localId: `a${i}`,
    display_name: `Concept ${i}`,
    frozen_price: '4.99',
    arm_label: String.fromCharCode(65 + i),
    image_url: image,
    image_filename: 'x.png',
    stimulus_payload: {},
  }
}

function product(i: number) {
  return {
    localId: `p${i}`,
    product_id: 100 + i,
    frozen_display_name: `Brand ${i}`,
    frozen_brand_name: `Brand ${i}`,
    frozen_image_url: `https://example.com/${i}.jpg`,
    frozen_price: '3.99',
    market_reference_price: '3.99',
    battle_intent: 'competitor' as const,
    upc: `02840000${1000 + i}`,
  }
}

function draft(nConcepts: number, nProducts: number): ConceptStudyDraft {
  const d = createEmptyConceptDraft()
  return {
    ...d,
    draftId: 'draft-seed-fixed',
    stimulusMode: 'package',
    pricePosture: 'blind',
    conceptArms: Array.from({ length: nConcepts }, (_, i) => arm(i)),
    products: Array.from({ length: nProducts }, (_, i) => product(i)),
  }
}

function questions(opts: { why?: boolean; session2?: boolean } = {}): ProtocolQuestion[] {
  const list: ProtocolQuestion[] = [
    {
      question_type_code: 'concept_screener',
      session_number: 1,
      position: 0,
      label: 'category_frequency',
      config: { prompt: 'How often?', options: ['Never', 'Weekly'], min_select: 1, max_select: 1 },
      is_required: true,
      drives_rounds: false,
    },
    {
      question_type_code: 'concept_battle',
      session_number: 1,
      position: 2,
      label: 'packaging_battles',
      config: { prompt: 'Which one would you reach for?', render: 'image_only', suppress_name: true },
      is_required: true,
      drives_rounds: true,
    },
    {
      question_type_code: 'concept_diagnostic',
      session_number: 1,
      position: 3,
      label: 'choice_driver',
      config: { prompt: 'Why?', focal_arm: 'respondent_winner', options: ['Colors', 'Quality'] },
      is_required: true,
      drives_rounds: false,
    },
    {
      question_type_code: 'concept_floor',
      session_number: 1,
      position: 7,
      label: 'purchase_floor',
      config: { prompt: 'Would you buy it?', focal_arm: 'respondent_winner', options: ['yes', 'maybe', 'no'] },
      is_required: true,
      drives_rounds: false,
    },
    {
      question_type_code: 'concept_wtp',
      session_number: 1,
      position: 8,
      label: 'wtp_per_arm',
      config: {
        prompt: 'How much would you pay?',
        focal_arm: 'each_arm',
        options: [{ id: 'b1', label: '$4–5', low: 4, high: 5 }],
      },
      is_required: true,
      drives_rounds: false,
    },
  ]
  if (opts.why) {
    list.push({
      question_type_code: 'attribute_battle',
      session_number: 1,
      position: 2.5,
      label: 'why',
      config: {
        sampled: true,
        linked_to: 'forced_choice_battle',
        prompt: 'Why this one?',
        options: ['Taste', 'Look', 'Price', 'Habit', 'Quality', 'Fun', 'New', 'Other'],
      },
      is_required: false,
      drives_rounds: false,
    })
  }
  if (opts.session2) {
    list.push({
      question_type_code: 'concept_diagnostic',
      session_number: 2,
      position: 1,
      label: 's2',
      config: { prompt: 'Session 2 should not render' },
      is_required: false,
      drives_rounds: false,
    })
  }
  return list
}

function planFor(nConcepts: number, nProducts: number, q = questions({ why: true })) {
  const d = draft(nConcepts, nProducts)
  return synthesizePlan({
    questions: q,
    combatants: combatantsFromDraft(d),
    seed: d.draftId,
    stimulusMode: d.stimulusMode,
    pricePosture: d.pricePosture,
  })
}

describe('synthesizePlan fixtures', () => {
  it('n=2 → 1 battle, no 0-battle screen', () => {
    const screens = planFor(1, 1, questions())
    const battles = screens.filter((s) => isBattleKind(s.kind))
    expect(battles).toHaveLength(1)
    expect(screens.some((s) => s.kind === 'session_summary')).toBe(true)
    expect(screens[0]?.kind).toBe('screener')
  })

  it('n=6 → 15 battles and exactly 3 why screens', () => {
    const screens = planFor(2, 4)
    expect(screens.filter((s) => isBattleKind(s.kind))).toHaveLength(15)
    expect(screens.filter((s) => s.kind === 'attribute_followup')).toHaveLength(3)
    const whyRounds = sampledWhyRounds('draft-seed-fixed', 15, 3)
    expect(whyRounds).toHaveLength(3)
  })

  it('skips session_number !== 1', () => {
    const screens = planFor(1, 1, questions({ session2: true }))
    expect(screens.some((s) => 'label' in s && s.label === 's2')).toBe(false)
  })

  it('each_arm WTP explodes per concept arm as diagnostic', () => {
    const screens = planFor(2, 2, questions())
    const wtp = screens.filter((s) => s.kind === 'diagnostic' && 'question_type' in s && s.question_type === 'concept_wtp')
    expect(wtp).toHaveLength(2)
    expect(wtp.every((s) => s.kind === 'diagnostic')).toBe(true)
  })

  it('respondent_winner leaves subject null for live resolve', () => {
    const screens = planFor(1, 1, questions())
    const winnerQ = screens.find(
      (s) => s.kind === 'diagnostic' && 'focal_arm' in s && s.focal_arm === 'respondent_winner'
    )
    expect(winnerQ && 'resolve_subject' in winnerQ && winnerQ.resolve_subject).toBe(
      'client_session_winner'
    )
    expect(winnerQ && 'subject' in winnerQ && winnerQ.subject).toBeNull()
  })

  it('blind posture strips prices on battle tiles', () => {
    const screens = planFor(1, 1, questions())
    const battle = screens.find((s) => isBattleKind(s.kind))
    expect(battle && 'combatant_a' in battle && battle.combatant_a?.price).toBeNull()
    expect(battle && 'combatant_b' in battle && battle.combatant_b?.price).toBeNull()
  })

  it('combatant with no image is marked unavailable', () => {
    const d = draft(1, 1)
    d.conceptArms[0] = { ...d.conceptArms[0]!, image_url: null }
    const screens = synthesizePlan({
      questions: questions(),
      combatants: combatantsFromDraft(d),
      seed: d.draftId,
      stimulusMode: 'package',
      pricePosture: 'blind',
    })
    const battle = screens.find((s) => isBattleKind(s.kind))
    const tiles = battle && 'combatant_a' in battle ? [battle.combatant_a, battle.combatant_b] : []
    expect(tiles.some((t) => t?.image_unavailable === true || !t?.image_url)).toBe(true)
  })
})

describe('winner + recap', () => {
  it('all-abstain does not fabricate a winner', () => {
    let tally = emptyWinTally()
    tally = applyBattleWin(tally, 'NEITHER', 1, 2)
    tally = applyBattleWin(tally, 'SKIP', 1, 2)
    expect(mostChosenCombatantRef(tally)).toBeNull()
    const recap = buildRecap({
      screens: [],
      battleWins: tally,
      battleTotal: 2,
      combatantNames: new Map([[1, 'A'], [2, 'B']]),
      choiceLines: [],
      mostChosen: mostChosenCombatantRef(tally),
    })
    expect(recap[0]?.text).toMatch(/no clear pick/i)
  })
})

describe('parsePreviewQuestionnaire', () => {
  it('maps OPTION_ID_UNRESOLVED to the field-fix message', () => {
    expect(
      parsePreviewQuestionnaire({ error: 'failed', hint: 'OPTION_ID_UNRESOLVED' })
    ).toEqual({ error: DEACTIVATED_BRAND_MESSAGE })
  })
})
