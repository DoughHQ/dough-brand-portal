import { describe, expect, it } from 'vitest'
import { createEmptyConceptDraft } from '../defaults'
import type { ConceptJourney } from '../journey'
import {
  firstUnfinishedJourneyStep,
  journeyStepCountLabel,
  journeyStepCountsAsScreen,
  journeyStepDone,
  journeyStepOwned,
  journeyStepSummary,
} from '../journeyAccordion'
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
    expect(journeyStepSummary('battles', draft)).toBe('Would buy')
    expect(journeyStepDone('battles', draft)).toBe(true)
    expect(firstUnfinishedJourneyStep(draft)).toBe('price')
  })

  it('reads a finished battle row as the selected prompt', () => {
    expect(journeyStepSummary('battles', createEmptyConceptDraft())).toBe('Would buy')
  })

  it('gives locked steps no form and no check', () => {
    const draft = createEmptyConceptDraft()
    expect(journeyStepOwned('first_look')).toBe(false)
    expect(journeyStepOwned('what_matters')).toBe(false)
    expect(journeyStepOwned('rank')).toBe(false)
    expect(journeyStepOwned('open_text')).toBe(false)
    expect(journeyStepDone('first_look', draft)).toBe(false)
    expect(journeyStepSummary('first_look', draft)).toBe('Set by Dough')
  })

  it('does not treat an empty price as finished', () => {
    expect(journeyStepDone('price', createEmptyConceptDraft())).toBe(false)
    expect(journeyStepSummary('price', createEmptyConceptDraft())).toBe('Needs a price')
  })

  it('leaves success bars out of the respondent screen count', () => {
    expect(journeyStepCountsAsScreen('success')).toBe(false)
    expect(journeyStepCountLabel('success', counts)).toBeNull()
    expect(journeyStepCountLabel('battles', counts)).toBe('6 screens')
    expect(journeyStepCountLabel('what_matters', counts)).toBe('7 sets')
    expect(journeyStepCountLabel('battles', null)).toBeNull()
  })

  it('accepts a custom battle prompt only when respondents can read it', () => {
    const draft = createEmptyConceptDraft({
      battlePromptCode: null,
      customBattlePrompt: 'Which pack would you reach for?',
    })
    expect(journeyStepDone('battles', draft)).toBe(true)
    expect(journeyStepSummary('battles', draft)).toBe('Which pack would you reach for?')

    const short = createEmptyConceptDraft({
      battlePromptCode: null,
      customBattlePrompt: 'Buy this',
    })
    expect(journeyStepDone('battles', short)).toBe(false)
  })
})
