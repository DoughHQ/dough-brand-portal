import { describe, expect, it } from 'vitest'
import { createEmptyConceptDraft, newConceptArm, newProductCompetitor } from '../defaults'
import type { ConceptJourney } from '../journey'
import {
  brandQuestionClosedLine,
  brandQuestionScreenLabel,
  firstUnfinishedJourneyStep,
  journeyAsked,
  journeyClosedLine,
  journeyStepCountLabel,
  journeyStepCountsAsScreen,
  journeyStepDone,
  journeyStepOwned,
  pairedScreenerCountLabel,
  whatMattersAsked,
  whyFollowupAsked,
  whyFollowupCountLabel,
} from '../journeyAccordion'
import { emptyBrandQuestion } from '../singleTest'
import { brandVerificationOption } from '../templateConfig'

const counts: ConceptJourney['counts'] = {
  total_min: 23,
  total_max: 23,
  screeners: 2,
  first_look: 3,
  battles: 6,
  maxdiff_sets: 7,
  rank: 1,
  price: 1,
  brand_questions: 0,
  open_text: 1,
}

describe('journey accordion', () => {
  it('opens the first unfinished step the brand owns', () => {
    expect(firstUnfinishedJourneyStep(createEmptyConceptDraft())).toBe('screeners')
  })

  it('moves to price once two brands are set and the battle prompt is the default', () => {
    const draft = createEmptyConceptDraft({
      templateConfig: {
        ...createEmptyConceptDraft().templateConfig,
        verification_options: [
          brandVerificationOption(1, 'Halo Top'),
          brandVerificationOption(2, "Ben & Jerry's"),
        ],
      },
    })
    expect(journeyClosedLine('battles', draft, null)).toEqual({
      kind: 'question',
      text: 'Which one would you buy?',
    })
    expect(journeyStepDone('battles', draft)).toBe(true)
    expect(firstUnfinishedJourneyStep(draft)).toBe('price')
  })

  it('reads a finished battle row as the question respondents see', () => {
    expect(journeyClosedLine('battles', createEmptyConceptDraft(), null)).toEqual({
      kind: 'question',
      text: 'Which one would you buy?',
    })
  })

  it('gives the fixed steps the question, not a status line', () => {
    const draft = createEmptyConceptDraft()
    expect(journeyStepOwned('first_look')).toBe(false)
    expect(journeyStepOwned('what_matters')).toBe(false)
    expect(journeyStepOwned('rank')).toBe(false)
    expect(journeyStepOwned('open_text')).toBe(false)
    expect(journeyStepDone('first_look', draft)).toBe(false)
    expect(journeyClosedLine('first_look', draft, null)).toEqual({
      kind: 'question',
      text: 'First impression: how do you feel about this one?',
    })
    expect(journeyClosedLine('what_matters', draft, null)).toEqual({
      kind: 'question',
      text: 'When you look at the package, which matters most to you, and which matters least?',
    })
    expect(journeyClosedLine('rank', draft, null)).toEqual({
      kind: 'question',
      text: 'Put them in order, your favorite at the top.',
    })
    expect(journeyClosedLine('open_text', draft, null)).toEqual({
      kind: 'question',
      text: "Anything else you'd like the brand to know?",
    })
  })

  it('marks an unfinished step with the required dot instead of a summary', () => {
    const draft = createEmptyConceptDraft()
    expect(journeyStepDone('price', draft)).toBe(false)
    expect(journeyClosedLine('price', draft, null)).toEqual({ kind: 'required' })
    expect(journeyClosedLine('screeners', draft, null)).toEqual({ kind: 'required' })
  })

  it('leaves success bars out of the respondent screen count', () => {
    expect(journeyStepCountsAsScreen('success')).toBe(false)
    expect(journeyStepCountLabel('success', counts)).toBeNull()
    expect(journeyStepCountLabel('battles', counts)).toBe('6 screens')
    expect(journeyStepCountLabel('what_matters', counts)).toBe('7 screens')
    expect(journeyStepCountLabel('battles', null)).toBeNull()
  })

  it('accepts a custom battle prompt only when respondents can read it', () => {
    const draft = createEmptyConceptDraft({
      battlePromptCode: null,
      customBattlePrompt: 'Which pack would you reach for?',
    })
    expect(journeyStepDone('battles', draft)).toBe(true)
    expect(journeyClosedLine('battles', draft, null)).toEqual({
      kind: 'question',
      text: 'Which pack would you reach for?',
    })

    const short = createEmptyConceptDraft({
      battlePromptCode: null,
      customBattlePrompt: 'Buy this',
    })
    expect(journeyStepDone('battles', short)).toBe(false)
    expect(journeyClosedLine('battles', short, null)).toEqual({ kind: 'required' })
  })

  it('shows the what-matters prompt and the seven package options', () => {
    const asked = whatMattersAsked(null)
    expect(asked.prompt).toBe(
      'When you look at the package, which matters most to you, and which matters least?'
    )
    expect(asked.items).toEqual([
      'Looks tasty',
      'Easy to tell what it is',
      'Looks high quality',
      'Looks like good value',
      'Stands out',
      'What it says on the front',
      'The colors and design',
    ])

    const fromJourney = whatMattersAsked([
      {
        kind: 'maxdiff',
        prompt: 'When you look at the package, which matters most to you, and which matters least?',
        items: ['Stands out', 'Looks tasty'],
      },
    ])
    expect(fromJourney.items).toEqual(['Stands out', 'Looks tasty'])
  })

  it('asks screeners as the frequency question, then the brands they named', () => {
    const draft = createEmptyConceptDraft({
      templateConfig: {
        ...createEmptyConceptDraft().templateConfig,
        category_plural: 'pints of ice cream',
        decoy_option: 'Frostline',
        verification_options: [
          brandVerificationOption(1, 'Halo Top'),
          brandVerificationOption(2, "Ben & Jerry's"),
        ],
      },
    })
    expect(journeyClosedLine('screeners', draft, null)).toEqual({
      kind: 'question',
      text: 'Which of these have you bought in the last 3 months? Select all that apply.',
    })
    expect(pairedScreenerCountLabel(counts)).toBe('1 screen')
    expect(pairedScreenerCountLabel({ ...counts, screeners: 3 })).toBeNull()
    expect(pairedScreenerCountLabel(null)).toBeNull()
    expect(journeyAsked('screeners', draft, null)).toEqual([
      {
        prompt: 'How often do you buy pints of ice cream?',
        items: [
          'Never',
          'A few times a year',
          'About once a month',
          '2-3 times a month',
          'Weekly or more',
        ],
      },
      {
        prompt: 'Which of these have you bought in the last 3 months? Select all that apply.',
        items: ['Halo Top', "Ben & Jerry's", 'Frostline', 'None of these'],
      },
    ])
  })

  it('asks why they picked it, and counts that follow-up as an upper bound', () => {
    expect(whyFollowupAsked(null).prompt).toBe('What made you pick this one?')
    expect(whyFollowupAsked(null).note).toBe('After each pick.')
    expect(whyFollowupAsked(null).items).toContain('I know this brand')
    expect(whyFollowupCountLabel({ ...counts, why_followups_up_to: 3 })).toBe('Up to 3 screens')
    expect(whyFollowupCountLabel({ ...counts, why_followups_up_to: 1 })).toBe('Up to 1 screen')
    expect(whyFollowupCountLabel(counts)).toBeNull()
    expect(whyFollowupCountLabel(null)).toBeNull()
  })

  it('ranks the field as design letters, with the current pack named', () => {
    const draft = createEmptyConceptDraft({
      conceptArms: [
        newConceptArm(0),
        { ...newConceptArm(1), benchmark_role: 'current_pack' },
        newConceptArm(2),
      ],
    })
    expect(journeyAsked('rank', draft, null)[0]).toEqual({
      prompt: 'Put them in order, your favorite at the top.',
      items: ['Design A', 'Design B, your current pack', 'Design C'],
    })
  })

  it('ranks every chosen competitor with the designs', () => {
    const draft = createEmptyConceptDraft({
      conceptArms: [
        newConceptArm(0),
        { ...newConceptArm(1), benchmark_role: 'current_pack' },
      ],
      products: [
        {
          ...newProductCompetitor(),
          product_id: 42,
          frozen_display_name: "Ben & Jerry's Half Baked",
          frozen_brand_name: "Ben & Jerry's",
        },
        newProductCompetitor(),
      ],
    })
    expect(journeyAsked('rank', draft, null)[0]?.items).toEqual([
      'Design A',
      'Design B, your current pack',
      "Ben & Jerry's Half Baked",
    ])
  })

  it('keeps the current pack’s letter when it leads the field', () => {
    const draft = createEmptyConceptDraft({
      conceptArms: [
        { ...newConceptArm(0), benchmark_role: 'current_pack' },
        newConceptArm(1),
      ],
    })
    expect(journeyAsked('rank', draft, null)[0]?.items).toEqual([
      'Design A, your current pack',
      'Design B',
    ])
  })

  it('prices from the pack size and keeps the reject option', () => {
    const draft = createEmptyConceptDraft({
      templateConfig: {
        ...createEmptyConceptDraft().templateConfig,
        pack_size: 'pint',
        expected_price: '7.99',
      },
    })
    const [price] = journeyAsked('price', draft, null)
    expect(journeyClosedLine('price', draft, null)).toEqual({
      kind: 'question',
      text: 'How much would you pay for a pint of this?',
    })
    expect(price?.prompt).toBe('How much would you pay for a pint of this?')
    expect(price?.items.at(-1)).toBe("I wouldn't buy it")
  })

  it('leaves your questions blank until one is started, then requires a finished prompt', () => {
    expect(journeyClosedLine('brand_questions', createEmptyConceptDraft(), null)).toEqual({
      kind: 'empty',
    })
    const started = createEmptyConceptDraft({
      brandQuestions: [{ ...emptyBrandQuestion(), prompt: 'Which flavor' }],
    })
    expect(journeyClosedLine('brand_questions', started, null)).toEqual({ kind: 'required' })
    const ready = createEmptyConceptDraft({
      brandQuestions: [
        {
          ...emptyBrandQuestion(),
          prompt: 'Which flavor would you buy?',
          options: ['Vanilla', 'Chocolate'],
        },
      ],
    })
    expect(journeyClosedLine('brand_questions', ready, null)).toEqual({
      kind: 'question',
      text: 'Which flavor would you buy?',
    })
    expect(brandQuestionClosedLine(ready.brandQuestions![0]!)).toEqual({
      kind: 'question',
      text: 'Which flavor would you buy?',
    })
    expect(brandQuestionClosedLine(started.brandQuestions![0]!)).toEqual({ kind: 'required' })
    expect(brandQuestionScreenLabel(2, { ...counts, brand_questions: 2 })).toBe('1 screen')
    expect(brandQuestionScreenLabel(2, { ...counts, brand_questions: 1 })).toBeNull()
    expect(brandQuestionScreenLabel(1, null)).toBeNull()
  })

  it('keeps the optional parenthetical on the open-text question respondents see', () => {
    const [open] = journeyAsked('open_text', createEmptyConceptDraft(), null)
    expect(open?.prompt).toBe("Anything else you'd like the brand to know? (optional)")
    expect(open?.blank).toBe(true)
  })
})
