import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import AudienceSection from '../../AudienceSection'
import ConceptAudienceCategory from '../ConceptAudienceCategory'

function renderAudience(
  overrides: Partial<Parameters<typeof AudienceSection>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(AudienceSection, {
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

describe('AudienceSection', () => {
  it('opens an empty concept audience with no tried-product gate', () => {
    const markup = renderAudience()

    expect(markup).toContain('id="concept-audience"')
    expect(markup).toContain('id="concept-aud-states"')
    expect(markup).toContain('id="concept-aud-category-bars"')
    expect(markup).not.toContain('role="alert"')
    expect(markup).not.toContain('role="status"')
    expect(markup).not.toContain('pointer-events:none')
    expectOrder(markup, [
      'Section 4 · Audience',
      'Who qualifies',
      '“tried this product” gate — nobody has tried a concept that doesn’t',
      'exist yet.',
      'All filters are optional. Leave them blank to let anyone take the study.',
      'Open to everyone — no restrictions',
      '+ Narrow further',
      'Category expertise',
      'it can’t be farmed by spamming battles.',
      '+ Add a category requirement',
    ])
  })

  it('shows an age chip, a lock reason, and a section error', () => {
    const draft = createEmptyConceptDraft()
    draft.eligibility = { ...draft.eligibility, minAge: 21 }
    const markup = renderAudience({
      draft,
      disabled: true,
      disabledReason: 'View only',
      error: 'Name who can take this study.',
    })

    expect(markup).toContain('opacity:0.55')
    expect(markup).toContain('pointer-events:none')
    expect(markup).not.toContain('Open to everyone — no restrictions')
    expect(markup).not.toContain('+ Narrow further')
    expectOrder(markup, [
      'Who qualifies',
      'Age 21+',
      'role="status"',
      'View only',
      'US states',
      'Leave empty to include respondents in any state.',
      'role="alert"',
      'Name who can take this study.',
    ])
  })

  it('shows tries in the category help once a requirement is open', () => {
    const draft = createEmptyConceptDraft()
    const markup = renderToStaticMarkup(
      createElement(ConceptAudienceCategory, {
        eligibility: draft.eligibility,
        studyTaxonomyNodeId: draft.taxonomyNodeId,
        qualifyingNode: null,
        setQualifyingNode: () => {},
        patch: () => {},
        categoryOpen: true,
        onCategoryOpenChange: () => {},
      }),
    )

    expect(markup).toContain('Min tries')
    expect(markup).not.toContain('+ Add a category requirement')
    expectOrder(markup, [
      'Category expertise',
      'before someone can take the study',
      'it can’t be farmed by spamming battles.',
      'level, tries, or battle bar below.',
      'Min tries',
    ])
  })
})
