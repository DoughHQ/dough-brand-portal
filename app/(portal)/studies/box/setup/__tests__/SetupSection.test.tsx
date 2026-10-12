import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyBoxDraft } from '@/lib/box/defaults'
import SetupSection from '../../SetupSection'

vi.mock('server-only', () => ({}))

function renderSetup(
  overrides: Partial<Parameters<typeof SetupSection>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(SetupSection, {
      draft: createEmptyBoxDraft(1),
      onChange: () => {},
      ...overrides,
    }),
  )
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('SetupSection', () => {
  it('opens an empty box setup and waits for a completion target', () => {
    const markup = renderSetup()

    expect(markup).toContain('id="box-setup"')
    expect(markup).toContain('Name the study · choose a category')
    expect(markup).toContain('data-done="false"')
    expect(markup).toContain('class="box-completion-contract is-empty"')
    expect(markup).not.toContain('Dough fielding plan')
    expect(markup).not.toContain('role="alert"')
    expectOrder(markup, [
      'Setup',
      'Name the study, pick the category, and choose the completed responses',
      'Dough handles inventory and timing.',
      'Study name',
      'id="box-study-name"',
      'placeholder="e.g. Gluten-free NYC discovery box"',
      'id="box-category"',
      'Category',
      'Search categories',
      'id="box-logistics"',
      'How it runs',
      'id="box-log-units"',
      'Completed respondents',
      'placeholder="e.g. 100"',
      'id="box-completion-help"',
      'The completed responses the final report is built on.',
      'Enter a target to see the box plan.',
      'Hide our brand from respondents',
      'don’t see who funded the box',
    ])
  })

  it('shows the fielding plan once a completion target is set', () => {
    const draft = createEmptyBoxDraft(1)
    draft.title = 'Discovery box'
    draft.targetCompletions = 100
    draft.blindSponsor = true
    const markup = renderSetup({ draft })

    expect(markup).toContain('Discovery box · Choose a category')
    expect(markup).toContain('data-done="false"')
    expect(markup).toContain('value="Discovery box"')
    expect(markup).toContain('value="100"')
    expect(markup).toContain('checked=""')
    expect(markup).not.toContain('is-empty')
    expectOrder(markup, [
      'Dough fielding plan',
      'Prepare 110 boxes',
      '100 for the completed field, plus 10 (10%) for expected non-completion.',
      'Each respondent gets 14 days after delivery.',
      'Recruitment stops at the target; anyone already shipped can still finish.',
      'Hide our brand from respondents',
    ])
  })

  it('collapses once the parent marks setup done', () => {
    const markup = renderSetup({ sectionDone: true })

    expect(markup).toContain('data-done="true"')
    expect(markup).toContain('data-open="false"')
    expect(markup).toContain('Name the study · choose a category')
    expect(markup).not.toContain('id="box-study-name"')
    expect(markup).not.toContain('How it runs')
  })

  it('names a one-box overage and a pending category', () => {
    const draft = createEmptyBoxDraft(1)
    draft.targetCompletions = 1
    draft.taxonomyNodeId = 12
    const markup = renderSetup({
      draft,
      error: 'Give the box study a name.',
    })

    expect(markup).toContain('Prepare 2 boxes')
    expect(markup).toContain('1 for the completed field, plus 1 (10%) for expected non-completion.')
    expect(markup).toContain('Loading category…')
    expect(markup).toContain('Give the box study a name.')
    expect(markup).not.toContain('Search categories')
  })
})
