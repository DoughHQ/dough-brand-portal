import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyBoxDraft } from '@/lib/box/defaults'
import type { CountBoxQualifiersResult } from '@/lib/box/countQualifiers'
import AudienceSection from '../../AudienceSection'
import AudienceEstimateNote from '../AudienceEstimateNote'
import BoxAudienceCategory from '../BoxAudienceCategory'

vi.mock('server-only', () => ({}))

function renderAudience(
  overrides: Partial<Parameters<typeof AudienceSection>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(AudienceSection, {
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

describe('AudienceSection', () => {
  it('opens an empty box audience and waits for a hero product', () => {
    const markup = renderAudience()

    expect(markup).toContain('id="box-audience"')
    expect(markup).toContain('id="box-aud-states"')
    expect(markup).toContain('id="box-aud-category-bars"')
    expect(markup).toContain('data-done="false"')
    expect(markup).toContain('data-open="true"')
    expect(markup).not.toContain('role="alert"')
    expectOrder(markup, [
      'Audience',
      'Open to everyone',
      'All filters are optional. Leave them blank to let anyone qualify.',
      'Choose a hero product to see who qualifies',
      'Open to everyone — no restrictions',
      'Live estimate against current users — grows as more people join',
      'Experience with the hero product',
      'No prior experience required',
      'Has tried this product',
      'Has not tried this product',
      '+ Narrow further',
      'Category expertise',
      'it can’t be farmed by spamming battles.',
      '+ Add a category requirement',
    ])
  })

  it('summarizes a tried-hero audience and shows a section error', () => {
    const draft = createEmptyBoxDraft(1)
    draft.eligibilityTier = 'tried'
    const markup = renderAudience({
      draft,
      error: 'Name the audience.',
    })

    expect(markup).toContain('Must have tried hero')
    expect(markup).toContain('Has tried this product')
    expect(markup).toContain('aria-checked="true"')
    expect(markup).not.toContain('Open to everyone — no restrictions')
    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Name the audience.')
    expectOrder(markup, [
      'Must have tried hero',
      'Has tried this product',
      'Live estimate against current users — grows as more people join',
      'role="alert"',
      'Name the audience.',
    ])
  })

  it('hides the audience body once the section is done', () => {
    const markup = renderAudience({ sectionDone: true })

    expect(markup).toContain('data-done="true"')
    expect(markup).toContain('data-open="false"')
    expect(markup).toContain('Open to everyone')
    expect(markup).not.toContain('All filters are optional')
    expect(markup).not.toContain('Category expertise')
  })

  it('shows a qualifier warning under the live estimate', () => {
    const count: CountBoxQualifiersResult = {
      qualifying_users: 12,
      total_users: 40,
      pass_experience: 20,
      pass_rules: 12,
      below_viable_floor: true,
      warning: 'Too few people qualify for a stable read.',
    }
    const markup = renderToStaticMarkup(
      createElement(AudienceEstimateNote, {
        estimate: { count },
      }),
    )

    expect(markup).toContain(
      'Live estimate against current users — grows as more people join',
    )
    expect(markup).toContain('Too few people qualify for a stable read.')
    expectOrder(markup, [
      'Live estimate against current users — grows as more people join',
      'Too few people qualify for a stable read.',
    ])
  })

  it('shows the category help once a requirement is open', () => {
    const draft = createEmptyBoxDraft(1)
    const markup = renderToStaticMarkup(
      createElement(BoxAudienceCategory, {
        eligibility: draft.eligibility,
        studyTaxonomyNodeId: draft.taxonomyNodeId,
        qualifyingNode: null,
        setQualifyingNode: () => {},
        patch: () => {},
        categoryOpen: true,
        onCategoryOpenChange: () => {},
      }),
    )

    expect(markup).toContain('Category expertise')
    expect(markup).toContain(
      'Can be any level — a broad L1/L2 sums breadth across its subcategories',
    )
    expect(markup).not.toContain('+ Add a category requirement')
    expectOrder(markup, [
      'Category expertise',
      'it can’t be farmed by spamming battles.',
      'Can be any level — a broad L1/L2 sums breadth across its subcategories',
    ])
  })
})
