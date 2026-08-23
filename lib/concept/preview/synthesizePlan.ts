import type { PricePosture, StimulusMode } from '@/lib/concept/types'
import { sampledWhyRounds } from './md5'
import {
  representativePairs,
  type PreviewCombatant,
} from './combatants'
import type {
  ConceptPlanCombatant,
  ConceptPlanScreen,
  ConceptPlanSubject,
  ConceptScreenConfig,
  ProtocolQuestion,
} from './planTypes'
import { shouldSuppressCombatantLabels } from './planTypes'

const WHY_K = 3

function asConfig(raw: Record<string, unknown> | undefined): ConceptScreenConfig {
  return (raw ?? {}) as ConceptScreenConfig
}

function qid(q: ProtocolQuestion): string {
  if (typeof q.id === 'string' && q.id.trim()) return q.id
  return `preview:${q.question_type_code}:${q.position}:${q.label}`
}

function isBattleQuestion(q: ProtocolQuestion): boolean {
  const code = q.question_type_code
  return (
    q.drives_rounds === true &&
    (code === 'concept_battle' || code === 'forced_choice_battle')
  )
}

function isWhyQuestion(q: ProtocolQuestion): boolean {
  if (q.question_type_code !== 'attribute_battle') return false
  if (q.drives_rounds) return false
  const cfg = asConfig(q.config)
  return cfg.sampled === true
}

function sessionOf(q: ProtocolQuestion): number {
  const n = Number(q.session_number)
  return Number.isFinite(n) ? n : 1
}

function toSubject(c: PreviewCombatant): ConceptPlanSubject {
  return {
    ref: c.ref,
    kind: c.kind,
    name: c.name,
    brand: c.brand,
    image_url: c.image_url,
    image_unavailable: !c.image_url,
    price: c.price,
  }
}

function toPlanCombatant(c: PreviewCombatant): ConceptPlanCombatant {
  return {
    ref: c.ref,
    kind: c.kind,
    name: c.name,
    brand: c.brand,
    image_url: c.image_url,
    image_unavailable: !c.image_url,
    price: c.price,
    stimulus_type: c.stimulus_type ?? null,
  }
}

function choiceKind(
  code: string
): 'diagnostic' | 'floor' | 'probe' {
  if (code === 'concept_floor') return 'floor'
  if (code === 'repurchase_probe') return 'probe'
  return 'diagnostic'
}

export function synthesizePlan(args: {
  questions: ProtocolQuestion[]
  combatants: PreviewCombatant[]
  seed: string
  stimulusMode: StimulusMode | null
  pricePosture: PricePosture
}): ConceptPlanScreen[] {
  const questions = args.questions.filter((q) => {
    if (sessionOf(q) === 1) return true
    console.warn(
      '[concept preview] skipping session_number !== 1 question',
      q.question_type_code,
      q.label
    )
    return false
  })

  const hidePrice =
    args.pricePosture === 'blind' ||
    args.stimulusMode === 'package' ||
    args.stimulusMode === 'price'

  const combatants = hidePrice
    ? args.combatants.map((c) => ({ ...c, price: null }))
    : args.combatants
  const byRef = new Map(combatants.map((c) => [c.ref, c]))
  const conceptArms = combatants.filter((c) => c.kind === 'concept')
  const assigned = conceptArms[0] ?? null

  const screens: ConceptPlanScreen[] = []
  let screenNo = 0

  const screeners = questions
    .filter((q) => q.question_type_code === 'concept_screener')
    .sort((a, b) => a.position - b.position)
  for (const q of screeners) {
    screenNo += 1
    screens.push({
      screen: screenNo,
      kind: 'screener',
      protocol_question_id: qid(q),
      question_type: q.question_type_code,
      label: q.label,
      config: asConfig(q.config),
      is_required: q.is_required,
      answered: false,
      answerable: true,
    })
  }

  const battleQ = questions.find(isBattleQuestion)
  const whyQ = questions.find(isWhyQuestion)
  const refs = combatants.map((c) => c.ref)
  const pairs = representativePairs(refs, args.seed)
  const whyRounds = whyQ
    ? new Set(sampledWhyRounds(args.seed, pairs.length, WHY_K))
    : new Set<number>()

  const battleConfig = asConfig(battleQ?.config)
  if (shouldSuppressCombatantLabels({ stimulusMode: args.stimulusMode, config: battleConfig })) {
    battleConfig.suppress_name = true
    battleConfig.render = battleConfig.render ?? 'image_only'
  }

  for (const pair of pairs) {
    screenNo += 1
    const ca = byRef.get(pair.combatant_ref_a)
    const cb = byRef.get(pair.combatant_ref_b)
    screens.push({
      screen: screenNo,
      kind: 'forced_choice_battle',
      question_type: battleQ?.question_type_code ?? 'concept_battle',
      protocol_question_id: battleQ ? qid(battleQ) : 'preview:battle',
      round_number: pair.round_number,
      combatant_ref_a: pair.combatant_ref_a,
      combatant_ref_b: pair.combatant_ref_b,
      presented_position: pair.presented_position,
      combatant_a: ca ? toPlanCombatant(ca) : undefined,
      combatant_b: cb ? toPlanCombatant(cb) : undefined,
      round_role: 'scoring',
      prompt: battleConfig.prompt ?? 'Which one would you reach for?',
      config: battleConfig,
      answered: false,
      answerable: true,
    })

    if (whyQ && whyRounds.has(pair.round_number)) {
      screenNo += 1
      screens.push({
        screen: screenNo,
        kind: 'attribute_followup',
        question_type: 'attribute_battle',
        protocol_question_id: qid(whyQ),
        label: whyQ.label,
        config: asConfig(whyQ.config),
        is_required: whyQ.is_required,
        linked_round_number: pair.round_number,
        combatant_ref_a: pair.combatant_ref_a,
        combatant_ref_b: pair.combatant_ref_b,
        winner_ref: null,
        answered: false,
        answerable: false,
      })
    }
  }

  const singleFocal = questions
    .filter((q) => {
      const code = q.question_type_code
      if (
        code !== 'concept_diagnostic' &&
        code !== 'concept_floor' &&
        code !== 'repurchase_probe'
      ) {
        return false
      }
      return asConfig(q.config).focal_arm !== 'each_arm'
    })
    .sort((a, b) => a.position - b.position)

  for (const q of singleFocal) {
    screenNo += 1
    const cfg = asConfig(q.config)
    const focal = cfg.focal_arm ?? ''
    const kind = choiceKind(q.question_type_code)
    const base = {
      screen: screenNo,
      kind,
      protocol_question_id: qid(q),
      question_type: q.question_type_code,
      label: q.label,
      config: cfg,
      is_required: q.is_required,
      focal_arm: focal,
      answered: false,
      answerable: true,
    } as const

    if (focal === 'assigned' && assigned) {
      screens.push({
        ...base,
        subject: toSubject(assigned),
        subject_ref: assigned.ref,
      })
    } else if (focal === 'respondent_winner') {
      screens.push({
        ...base,
        subject: null,
        subject_ref: null,
        resolve_subject: 'client_session_winner',
      })
    } else {
      screens.push({ ...base, subject: null, subject_ref: null })
    }
  }

  const eachArm = questions
    .filter((q) => asConfig(q.config).focal_arm === 'each_arm')
    .sort((a, b) => a.position - b.position)

  for (const q of eachArm) {
    const cfg = asConfig(q.config)
    const kind = q.question_type_code === 'concept_floor' ? 'floor' : 'diagnostic'
    for (const arm of conceptArms) {
      screenNo += 1
      screens.push({
        screen: screenNo,
        kind,
        protocol_question_id: qid(q),
        question_type: q.question_type_code,
        label: q.label,
        config: cfg,
        is_required: q.is_required,
        focal_arm: 'each_arm',
        subject: toSubject(arm),
        subject_ref: arm.ref,
        answered: false,
        answerable: true,
      })
    }
  }

  screenNo += 1
  screens.push({
    screen: screenNo,
    kind: 'session_summary',
    session_number: 1,
    answered: false,
    answerable: true,
  })

  return screens
}
