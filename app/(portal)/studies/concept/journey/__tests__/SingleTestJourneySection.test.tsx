import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import { defaultSuccessBarsDraft } from '@/lib/concept/singleTest'
import SingleTestJourneySection from '../../SingleTestJourneySection'
import JourneyBattlePrompt from '../JourneyBattlePrompt'
import JourneySuccessBars from '../JourneySuccessBars'

vi.mock('server-only', () => ({}))

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('SingleTestJourneySection', () => {
  it('keeps the question order and opens the unfinished screener', () => {
    const markup = renderToStaticMarkup(
      createElement(SingleTestJourneySection, {
        draft: createEmptyConceptDraft(),
        onChange: () => {},
        error: 'Name the study.',
      }),
    )

    expect(markup).toContain('id="concept-questions"')
    expect(markup).toContain('Building length…')
    expect(markup).toContain('disabled=""')
    expectOrder(markup, [
      'Questions',
      'They qualify, react to each design',
      'Preview',
      'Opens when the study is ready to publish.',
      'How often',
      'Bought recently',
      'id="journey-step-panel-screeners"',
      'Prefill decoy',
      'First look',
      'Battles',
      'What made you pick this one?',
      'What matters',
      'Rank the field',
      'Price',
      'Add a question',
      'Open text',
      'Name the study.',
      'Respondents never see this.',
      'When do you win?',
    ])
  })

  it('renders the battle prompt choices and a custom override', () => {
    const markup = renderToStaticMarkup(
      createElement(JourneyBattlePrompt, {
        draft: createEmptyConceptDraft({ customBattlePrompt: 'Which one?' }),
        onChange: () => {},
        usingCustom: true,
        customNote: { ok: false, message: 'Make it a question shoppers can answer.' },
      }),
    )

    expectOrder(markup, [
      'Battle prompt',
      'Would buy',
      'Which one would you buy?',
      'Write your own',
      'id="custom_battle_prompt"',
      'value="Which one?"',
      'Make it a question shoppers can answer.',
    ])
    expect(markup).toContain('aria-pressed="false"')
  })

  it('renders both success bars with their default controls', () => {
    const markup = renderToStaticMarkup(
      createElement(JourneySuccessBars, {
        bars: defaultSuccessBarsDraft(),
        priceLabel: '$4.99',
        onChange: () => {},
      }),
    )

    expect(markup).toContain('Use 50%')
    expect(markup).toContain('>Off<')
    expect(markup).toContain('type="range"')
  })
})
