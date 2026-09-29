import { respondentDesignLabel } from '@/lib/concept/designLetters'
import type { PhonePreviewJourney, PhonePreviewScreen, PhonePreviewSubject } from '@/lib/concept/journey'
import type { PreviewCombatant } from './combatants'
import { representativePairs } from './combatants'
import type {
  ConceptBattleScreenPlan,
  ConceptOption,
  ConceptPlanCombatant,
  ConceptPlanScreen,
  ConceptPlanSubject,
  ConceptScreenConfig,
} from './planTypes'
import { shouldSuppressCombatantLabels } from './planTypes'

/**
 * Turn a preview_concept_journey outline into the screens PreviewRunner
 * already walks. The outline stays in the builder. This is the phone.
 *
 * Concept names become Design letters. Package and price studies also hide
 * competitor names, matching the battle renderer.
 */
export function screensFromJourney(args: {
  journey: PhonePreviewJourney
  combatants: PreviewCombatant[]
  seed: string
  stimulusMode: string | null
}): { screens: ConceptPlanScreen[]; combatants: PreviewCombatant[] } {
  const combatants = labelCombatants(args.combatants, args.stimulusMode)
  const byRef = new Map(combatants.map((c) => [c.ref, c]))
  const suppress = shouldSuppressCombatantLabels({ stimulusMode: args.stimulusMode })
  const screens: ConceptPlanScreen[] = []
  let n = 0
  let pairs = representativePairs(
    combatants.map((c) => c.ref),
    args.seed
  )
  let pendingWhy: PhonePreviewScreen | null = null
  let battlesReady = false

  function nextScreen(): number {
    n += 1
    return n
  }

  function flushWhy() {
    if (!pendingWhy || pairs.length === 0) return
    const why = pendingWhy
    pendingWhy = null
    const limit = Math.min(Math.max(why.up_to ?? 1, 0), pairs.length)
    const options = asOptions(why.options)
    for (let i = 0; i < limit; i++) {
      const pair = pairs[i]!
      screens.push({
        screen: nextScreen(),
        kind: 'attribute_followup',
        linked_round_number: pair.round_number,
        combatant_ref_a: pair.combatant_ref_a,
        combatant_ref_b: pair.combatant_ref_b,
        winner_ref: null,
        protocol_question_id: `preview:why:${pair.round_number}`,
        label: 'Why this one',
        question_type: 'attribute_battle',
        is_required: why.optional !== true,
        config: {
          prompt: why.prompt ?? 'What made you pick this one?',
          options,
          max_select: 1,
          min_select: why.optional ? 0 : 1,
        },
        answered: false,
        answerable: false,
      })
    }
  }

  for (const stage of args.journey.screens) {
    if (stage.kind === 'why_followups') {
      pendingWhy = stage
      if (battlesReady) flushWhy()
      continue
    }
    if (stage.kind === 'battles') {
      const unique = pairs
      const count = Math.max(0, stage.count ?? unique.length)
      const battlePairs = expandBattleRounds(unique, count)
      pairs = battlePairs
      const config: ConceptScreenConfig = {
        prompt: stage.prompt ?? 'Which one would you buy?',
      }
      if (suppress) {
        config.suppress_name = true
        config.render = 'image_only'
      }
      for (const pair of battlePairs) {
        const ca = byRef.get(pair.combatant_ref_a)
        const cb = byRef.get(pair.combatant_ref_b)
        const battle: ConceptBattleScreenPlan = {
          screen: nextScreen(),
          kind: 'concept_battle',
          round_number: pair.round_number,
          combatant_ref_a: pair.combatant_ref_a,
          combatant_ref_b: pair.combatant_ref_b,
          presented_position: pair.presented_position,
          combatant_a: ca ? toPlanCombatant(ca) : undefined,
          combatant_b: cb ? toPlanCombatant(cb) : undefined,
          round_role: 'scoring',
          prompt: config.prompt,
          protocol_question_id: `preview:battle:${pair.round_number}`,
          question_type: 'concept_battle',
          config,
          answered: false,
          answerable: true,
        }
        screens.push(battle)
      }
      battlesReady = battlePairs.length > 0
      flushWhy()
      continue
    }
    if (stage.kind === 'summary') {
      screens.push({
        screen: nextScreen(),
        kind: 'session_summary',
        session_number: 1,
        answered: false,
        answerable: false,
      })
      continue
    }
    if (stage.kind === 'maxdiff') {
      for (const screen of maxdiffScreens(stage, nextScreen)) screens.push(screen)
      continue
    }
    screens.push(questionScreen(nextScreen(), stage, combatants))
  }

  flushWhy()
  return { screens, combatants }
}

function expandBattleRounds(
  unique: ReturnType<typeof representativePairs>,
  count: number
): ReturnType<typeof representativePairs> {
  if (unique.length === 0 || count === 0) return []
  const rounds = []
  for (let i = 0; i < count; i++) {
    const base = unique[i % unique.length]!
    const repeat = Math.floor(i / unique.length)
    rounds.push({
      round_number: i + 1,
      combatant_ref_a: base.combatant_ref_a,
      combatant_ref_b: base.combatant_ref_b,
      presented_position:
        repeat % 2 === 0
          ? base.presented_position
          : base.presented_position === 'a_left'
            ? 'b_left'
            : 'a_left',
    })
  }
  return rounds
}

function labelCombatants(
  combatants: PreviewCombatant[],
  stimulusMode: string | null
): PreviewCombatant[] {
  const suppress = shouldSuppressCombatantLabels({ stimulusMode })
  let conceptIndex = 0
  return combatants.map((c) => {
    if (c.kind === 'concept') {
      const labeled = {
        ...c,
        name: respondentDesignLabel(conceptIndex),
        brand: null,
      }
      conceptIndex += 1
      return labeled
    }
    if (suppress) {
      return { ...c, name: `Option ${c.ref}`, brand: null }
    }
    return c
  })
}

function toPlanCombatant(c: PreviewCombatant): ConceptPlanCombatant {
  return {
    ref: c.ref,
    kind: c.kind,
    name: c.name,
    brand: c.brand,
    image_url: c.image_url,
    image_unavailable: c.image_unavailable === true || !c.image_url,
    price: c.price,
    stimulus_type: c.stimulus_type ?? null,
  }
}

function questionScreen(
  screen: number,
  stage: PhonePreviewScreen,
  combatants: PreviewCombatant[]
): ConceptPlanScreen {
  const prompt = stage.prompt ?? ''
  const subject = subjectFor(stage.subject, combatants)
  const base = {
    screen,
    protocol_question_id: `preview:${stage.kind}:${screen}`,
    label: prompt,
    is_required: stage.optional !== true,
    answered: false as const,
    answerable: true,
  }

  if (stage.kind === 'screener') {
    return {
      ...base,
      kind: 'screener',
      question_type: 'screener',
      config: {
        prompt,
        options: asOptions(stage.options),
        max_select: stage.prompt?.toLowerCase().includes('select all') ? 8 : 1,
      },
    }
  }

  if (stage.kind === 'open_text') {
    return {
      ...base,
      kind: 'probe',
      question_type: 'open_text',
      subject,
      subject_ref: subject?.ref ?? null,
      config: {
        prompt,
        response: 'text',
        max_length: 280,
        min_select: stage.optional ? 0 : 1,
      },
    }
  }

  if (stage.kind === 'rank') {
    const options = combatants.map((c) => c.name)
    return {
      ...base,
      kind: 'diagnostic',
      question_type: 'rank',
      config: {
        prompt,
        options,
        min_select: 1,
        max_select: Math.max(1, options.length),
      },
    }
  }

  if (stage.kind === 'price') {
    return {
      ...base,
      kind: 'diagnostic',
      question_type: 'price',
      subject,
      subject_ref: subject?.ref ?? null,
      config: {
        prompt,
        options: asOptions(stage.bands),
        max_select: 1,
      },
    }
  }

  return {
    ...base,
    kind: 'diagnostic',
    question_type: stage.kind,
    subject,
    subject_ref: subject?.ref ?? null,
    config: {
      prompt,
      options: asOptions(stage.options),
      max_select: Math.max(1, stage.max_select ?? 1),
    },
  }
}

/** One screen per set, rotating the item window. Capped so a bad count cannot flood the phone. */
function maxdiffScreens(
  stage: PhonePreviewScreen,
  nextScreen: () => number
): ConceptPlanScreen[] {
  const items = stringList(stage.items)
  const per =
    items.length === 0
      ? 0
      : Math.max(1, Math.min(stage.items_per_set ?? items.length, items.length))
  const sets = Math.min(12, Math.max(1, stage.sets ?? 1))
  const screens: ConceptPlanScreen[] = []
  for (let set = 0; set < sets; set++) {
    const window: string[] = []
    for (let i = 0; i < per; i++) window.push(items[(set + i) % items.length]!)
    const screen = nextScreen()
    screens.push({
      screen,
      kind: 'probe',
      protocol_question_id: `preview:maxdiff:${set + 1}`,
      label: stage.prompt ?? 'Which matters most, and which matters least?',
      question_type: 'maxdiff',
      is_required: true,
      answered: false,
      answerable: true,
      subject: null,
      subject_ref: null,
      config: {
        prompt: stage.prompt ?? 'Which matters most, and which matters least?',
        options: window,
        min_select: 2,
        max_select: 2,
      },
    })
  }
  return screens
}

function subjectFor(
  subject: PhonePreviewSubject | undefined,
  combatants: PreviewCombatant[]
): ConceptPlanSubject | null {
  if (!subject) return null
  const byImage = subject.image_url
    ? combatants.find((c) => c.image_url && c.image_url === subject.image_url)
    : undefined
  const letter = /^Design\s+([A-Z])$/i.exec(subject.respondent_label.trim())
  const concepts = combatants.filter((c) => c.kind === 'concept')
  const byLetter = letter
    ? concepts[letter[1]!.toUpperCase().charCodeAt(0) - 65]
    : undefined
  const match = byImage ?? byLetter
  const name = subject.respondent_label.trim() || match?.name || 'Design'
  if (!match) {
    return {
      ref: 0,
      name,
      brand: null,
      image_url: subject.image_url,
      image_unavailable: !subject.image_url,
      price: null,
      kind: 'concept',
    }
  }
  return {
    ref: match.ref,
    name,
    brand: null,
    image_url: match.image_url ?? subject.image_url,
    image_unavailable: !(match.image_url ?? subject.image_url),
    price: match.price,
    kind: match.kind,
  }
}

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function asOptions(raw: unknown): ConceptOption[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item, i): ConceptOption[] => {
    if (typeof item === 'string') return [{ label: item }]
    if (item == null || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const label = typeof row.label === 'string' ? row.label : `Option ${i + 1}`
    const opt: ConceptOption = { label }
    if (typeof row.id === 'string') opt.id = row.id
    if (typeof row.value === 'string') opt.value = row.value
    if (typeof row.low === 'number' || row.low === null) opt.low = row.low as number | null
    if (typeof row.high === 'number' || row.high === null) opt.high = row.high as number | null
    return [opt]
  })
}
