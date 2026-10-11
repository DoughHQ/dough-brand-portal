import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import ConceptStudyClient from '../../ConceptStudyClient'
import NoVerificationDialog from '../NoVerificationDialog'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
  }),
}))

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('ConceptStudyClient', () => {
  it('opens a new concept study on setup and keeps the section order', () => {
    const markup = renderToStaticMarkup(
      createElement(ConceptStudyClient, {
        initialDraft: createEmptyConceptDraft(),
        mode: 'new',
      }),
    )

    expect(markup).toContain('class="concept-builder"')
    expect(markup).toContain('href="/studies"')
    expect(markup).not.toContain('role="dialog"')
    expect(markup).not.toContain('href="#concept-audience"')
    expect(markup).not.toContain('Awaiting payment')
    expect(markup).toContain('Choose a category for this study.')
    expect(markup).toContain('7 left')
    expect(markup).toContain('Preview')
    expect(markup).toContain('Publish study')
    expectOrder(markup, [
      '← Studies',
      'Concept study',
      'aria-label="Concept study sections"',
      'href="#concept-mode"',
      'Setup',
      'href="#concept-field"',
      'Field',
      'href="#concept-questions"',
      'Questionnaire',
      'id="concept-questions"',
    ])
  })

  it('uses the study name and hides publish for viewers', () => {
    const markup = renderToStaticMarkup(
      createElement(ConceptStudyClient, {
        initialDraft: createEmptyConceptDraft({ title: 'Citrus concepts' }),
        mode: 'edit',
        canPublish: false,
      }),
    )

    expect(markup).toContain('Citrus concepts')
    expect(markup).toContain('View only')
    expect(markup).not.toContain('Publish study')
  })

  it('asks before publishing without purchase verification', () => {
    const markup = renderToStaticMarkup(
      createElement(NoVerificationDialog, {
        publishing: false,
        onAddBrands: () => {},
        onPublish: () => {},
      }),
    )

    expect(markup).toContain('id="no-verification-title"')
    expectOrder(markup, [
      'Publish without purchase verification?',
      'You haven’t added verification brands.',
      'Add brands',
      'Publish anyway',
    ])
  })
})
