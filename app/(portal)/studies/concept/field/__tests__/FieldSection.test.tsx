import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyConceptDraft, newConceptArm } from '@/lib/concept/defaults'
import { normalizeDraft } from '@/lib/concept/normalizeDraft'
import FieldSection from '../../FieldSection'

vi.mock('server-only', () => ({}))

function renderField(
  overrides: Partial<Parameters<typeof FieldSection>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(FieldSection, {
      draft: normalizeDraft(createEmptyConceptDraft()),
      onChange: () => {},
      ...overrides,
    }),
  )
}

function arms(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const arm = newConceptArm(index)
    arm.display_name = `Design ${index + 1}`
    return arm
  })
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('FieldSection', () => {
  it('opens an empty single-test field without capacity or price posture', () => {
    const markup = renderField()

    expect(markup).toContain('id="concept-field"')
    expect(markup).toContain('class="cb-builder-section cb-field-section"')
    expect(markup).toContain('Add designs and competitors')
    expect(markup).toContain('data-done="false"')
    expect(markup).not.toContain('Price posture')
    expect(markup).not.toContain('cb-field-battles')
    expect(markup).not.toContain('data-testid="field-capacity"')
    expect(markup).not.toContain('Choose a category to continue')
    expectOrder(markup, [
      'Build the field',
      'Add your concepts, then choose the real products shoppers would compare them against.',
      'Your concepts',
      'Add your product',
      'Competitive set',
      'The products they face.',
      'Add at least 1 competitor',
      'Add competitors',
    ])
  })

  it('locks the field until a category is chosen', () => {
    const draft = normalizeDraft(createEmptyConceptDraft())
    draft.conceptArms = arms(1)
    const markup = renderField({
      draft,
      disabled: true,
    })

    expect(markup).toContain('Choose a category to continue')
    expect(markup).toContain(
      'We’ll unlock your product and competitors after you select a category above.',
    )
    expect(markup).not.toContain('data-testid="field-capacity"')
    expect(markup).not.toContain('role="alert"')
  })

  it('uses a caller reason and shows a field error', () => {
    const markup = renderField({
      disabled: true,
      disabledReason: 'Choose a category above to unlock the field.',
      error: 'Add at least one design.',
    })

    expect(markup).toContain('Choose a category above to unlock the field.')
    expect(markup).not.toContain('We’ll unlock your product')
    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Add at least one design.')
  })

  it('counts shared spots and reserves one for a competitor', () => {
    const one = normalizeDraft(createEmptyConceptDraft())
    one.conceptArms = arms(1)
    const four = normalizeDraft(createEmptyConceptDraft())
    four.conceptArms = arms(4)
    const over = normalizeDraft(createEmptyConceptDraft())
    over.conceptArms = arms(6)

    expect(renderField({ draft: one })).toContain('1 of 5 spots used')
    expect(renderField({ draft: four })).toContain(
      '4 of 5 spots used · 1 spot reserved for a required competitor',
    )
    const overMarkup = renderField({ draft: over })
    expect(overMarkup).toContain('6 of 5 spots used · Remove 1 item')
    expect(overMarkup).toContain('data-tone="warn"')
    expect(overMarkup).toContain('>!</')
  })

  it('shows battles and price posture when single-test packaging is off', () => {
    const draft = createEmptyConceptDraft({ stimulusMode: 'name', pricePosture: 'realistic' })
    draft.conceptArms = arms(2)
    const markup = renderField({ draft, singleTestMode: false })

    expect(markup).toContain('class="cb-field-battles"')
    expect(markup).toContain('2 products → 1 battle per respondent')
    expect(markup).toContain('Your product')
    expect(markup).toContain('Competitors')
    expectOrder(markup, [
      '2 products → 1 battle per respondent',
      'Price posture',
      'blind',
      'realistic · default',
      'variable',
      'Every competitor priced · closest to a real buy signal.',
    ])
  })
})
