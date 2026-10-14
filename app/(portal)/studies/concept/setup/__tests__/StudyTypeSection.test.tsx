import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'
import StudyTypeSection from '../../StudyTypeSection'
import CategoryWording from '../CategoryWording'

vi.mock('server-only', () => ({}))

const iceCream: TaxonomyNodeInfo = {
  taxonomy_node_id: 12,
  node_name_display: 'Ice Cream',
  node_name_normalized: 'ice cream',
  parent_taxonomy_node_id: null,
  l1_node_name: 'Food',
  l2_node_name: 'Frozen',
  breadcrumb: 'Food · Frozen',
}

function renderSection(
  overrides: Partial<Parameters<typeof StudyTypeSection>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(StudyTypeSection, {
      draft: createEmptyConceptDraft(),
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

describe('StudyTypeSection', () => {
  it('opens an empty packaging study on the locked setup', () => {
    const markup = renderSection()

    expect(markup).toContain('id="concept-mode"')
    expect(markup).toContain('class="cb-builder-section cb-setup"')
    expect(markup).toContain('data-done="false"')
    expect(markup).toContain('Choose a category · 100 completions · Runs until full · up to 90 days')
    expect(markup).toContain('Packaging concept · Blind · Design letters only')
    expect(markup).not.toContain('Study type')
    expect(markup).not.toContain('More study types coming soon')
    expect(markup).not.toContain('Edit questionnaire wording')
    expect(markup).toContain('type="hidden"')
    expect(markup).toContain('value="100"')
    expect(markup).not.toContain('Minimum 30')
    expectOrder(markup, [
      'Setup',
      'Name the study, choose where it competes, and set how many responses you need.',
      'Packaging concept · Blind · Design letters only',
      'id="concept-study-name"',
      'placeholder="e.g. Midnight Cocoa packaging"',
      'Respondents see this name.',
      'Category',
      'Choose a category to unlock the field.',
      'How it runs',
      '100 completions · Runs until full · up to 90 days',
      'Completions',
      '>30<',
      '>50<',
      '>100<',
      'Custom',
      'Runs until it',
      'for up to 90 days. You can end it sooner.',
      'refund for the responses you',
    ])
  })

  it('shows the study-type picker when packaging is not locked', () => {
    const markup = renderSection({ packagingOnly: false })

    expect(markup).not.toContain('Packaging concept · Blind · Design letters only')
    expect(markup).toContain('role="radiogroup"')
    expectOrder(markup, [
      'Study type',
      'Packaging',
      'Same product, different designs. Tells you which design to print.',
      'Price',
      'Blind price test — which design reads as premium, and what shoppers will pay.',
      'More study types coming soon',
      'Name · Flavor · Claim · Positioning · Full concept',
    ])
  })

  it('names the study in the readout and keeps the completion preset pressed', () => {
    const markup = renderSection({
      draft: createEmptyConceptDraft({ title: 'Midnight Cocoa packaging', targetCompletions: 50 }),
    })

    expect(markup).toContain('Midnight Cocoa packaging · 50 completions · Runs until full · up to 90 days')
    expect(markup).toContain('class="cb-setup-readout"')
    expect(markup).toContain('Midnight Cocoa packaging')
    expect(markup).toContain('aria-pressed="true">50<')
    expect(markup).toContain('aria-pressed="false">100<')
    expect(markup).toContain('data-done="false"')
  })

  it('shows a name error and a pending category anchor', () => {
    const markup = renderSection({
      draft: createEmptyConceptDraft({ taxonomyNodeId: 12 }),
      showErrors: true,
      error: 'Choose a category for this study.',
      titleError: 'Name this study.',
    })

    expect(markup).toContain('Name this study.')
    expect(markup).toContain('Loading category…')
    expect(markup).toContain('Choose a category for this study.')
    expect(markup).toContain('id="concept-q-category_plural"')
    expect(markup).toContain('Edit questionnaire wording')
    expect(markup).not.toContain('Search categories')
  })

  it('opens custom completions when the target is off the presets', () => {
    const markup = renderSection({
      draft: createEmptyConceptDraft({ targetCompletions: 40 }),
    })

    expect(markup).toContain('40 completions · Runs until full · up to 90 days')
    expect(markup).toContain('aria-pressed="true">Custom<')
    expect(markup).toContain('id="field_target_completions"')
    expect(markup).toContain('value="40"')
    expect(markup).toContain('Minimum 30. Type any count.')
    expect(markup).not.toContain('type="hidden"')
  })

  it('uses singular copy for one completion', () => {
    const markup = renderSection({
      draft: createEmptyConceptDraft({ targetCompletions: 1 }),
    })

    expect(markup).toContain('1 completion · Runs until full · up to 90 days')
    expect(markup).not.toContain('1 completions')
  })
})

describe('CategoryWording', () => {
  it('offers the default wording control once a category is known', () => {
    const draft = createEmptyConceptDraft({
      taxonomyNodeId: 12,
      title: 'Ice Cream concept test',
    })
    draft.templateConfig = { ...draft.templateConfig, category_plural: 'ice cream' }

    const markup = renderToStaticMarkup(
      createElement(CategoryWording, {
        draft,
        node: iceCream,
        hasCategory: true,
        wordingOpen: false,
        setWordingOpen: () => {},
        wording: 'ice cream',
        setWording: () => {},
        isDefaultWording: true,
        onSelect: () => {},
        onClear: () => {},
        error: null,
      }),
    )

    expect(markup).toContain('Ice Cream')
    expect(markup).toContain('Food · Frozen')
    expect(markup).toContain('Edit questionnaire wording')
    expect(markup).not.toContain('Use default')
    expect(markup).not.toContain('Questionnaire wording:')
  })

  it('shows a custom phrasing until the editor is opened', () => {
    const draft = createEmptyConceptDraft({ taxonomyNodeId: 12 })
    draft.templateConfig = { ...draft.templateConfig, category_plural: 'artisanal gelato' }

    const collapsed = renderToStaticMarkup(
      createElement(CategoryWording, {
        draft,
        node: iceCream,
        hasCategory: true,
        wordingOpen: false,
        setWordingOpen: () => {},
        wording: 'artisanal gelato',
        setWording: () => {},
        isDefaultWording: false,
        onSelect: () => {},
        onClear: () => {},
        error: null,
      }),
    )

    expect(collapsed).toContain('Questionnaire wording:')
    expect(collapsed).toContain('artisanal gelato')
    expect(collapsed).toContain('>Edit<')
    expect(collapsed).not.toContain('Edit questionnaire wording')

    const open = renderToStaticMarkup(
      createElement(CategoryWording, {
        draft,
        node: iceCream,
        hasCategory: true,
        wordingOpen: true,
        setWordingOpen: () => {},
        wording: 'artisanal gelato',
        setWording: () => {},
        isDefaultWording: false,
        onSelect: () => {},
        onClear: () => {},
        error: null,
      }),
    )

    expect(open).toContain('id="category_plural_s0"')
    expect(open).toContain('value="artisanal gelato"')
    expect(open).toContain('placeholder="ice cream"')
    expectOrder(open, [
      'Questionnaire wording',
      'id="category_plural_s0"',
      'Used where a respondent question needs the category name in a sentence.',
      'Close',
      'Use default',
    ])
  })
})
