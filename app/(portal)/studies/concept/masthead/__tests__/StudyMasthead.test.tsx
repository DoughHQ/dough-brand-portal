import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  createEmptyConceptDraft,
  newConceptArm,
  newProductCompetitor,
} from '@/lib/concept/defaults'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import StudyMasthead from '../../StudyMasthead'
import MastheadShelfPhoto from '../MastheadShelfPhoto'

function renderShelf(
  draft: ConceptStudyDraft,
  extras: { locked?: boolean; lockReason?: string | null } = {},
) {
  return renderToStaticMarkup(
    createElement(StudyMasthead, {
      draft,
      onOpenField: () => {},
      ...extras,
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

describe('StudyMasthead', () => {
  it('opens an empty shelf with both add shortcuts', () => {
    const markup = renderShelf(createEmptyConceptDraft())

    expect(markup).toContain('data-empty="true"')
    expect(markup).toContain('data-locked="false"')
    expect(markup).toContain('aria-label="Study field"')
    expect(markup).not.toContain('cb-masthead-vs')
    expect(markup).not.toContain('disabled=""')
    expectOrder(markup, [
      'Add a design',
      'Your concept',
      'Add a competitor',
      'On the shelf',
      '100 completions · Runs until full · up to 90 days',
      'Your field shows up here as you build it.',
    ])
  })

  it('locks the shortcuts and replaces the status line', () => {
    const markup = renderShelf(createEmptyConceptDraft(), {
      locked: true,
      lockReason: 'View only',
    })

    expect(markup).toContain('data-locked="true"')
    expect(markup).toContain('disabled=""')
    expect(markup).toContain('role="status"')
    expect(markup).toContain('View only')
    expect(markup).not.toContain('cb-masthead-helper')
    expect(markup).not.toContain('100 completions')
  })

  it('puts vs between a design and the competitor shortcut', () => {
    const draft = createEmptyConceptDraft({
      stimulusMode: 'package',
      conceptArms: [newConceptArm(0)],
    })
    const markup = renderShelf(draft)

    expect(markup).toContain('data-empty="false"')
    expect(markup).toContain('class="cb-masthead-letter"')
    expect(markup).not.toContain('<img')
    expect(markup).not.toContain('cb-masthead-helper')
    expectOrder(markup, [
      'Design A',
      'Design A',
      'Add a design',
      'Open seat',
      'class="cb-masthead-vs"',
      'vs',
      'Add a competitor',
      'On the shelf',
      '1 design · 0 competitors',
    ])
  })

  it('shows a catalog photo on the competitor side of vs', () => {
    const draft = createEmptyConceptDraft({
      stimulusMode: 'package',
      conceptArms: [{ ...newConceptArm(0), display_name: 'Citrus bar' }],
      products: [
        {
          ...newProductCompetitor(),
          frozen_display_name: 'North Creamery',
          frozen_brand_name: 'North',
          frozen_image_url: 'https://example.test/pint.png',
        },
      ],
    })
    const markup = renderShelf(draft)

    expect(markup).toContain('src="https://example.test/pint.png"')
    expect(markup).toContain('1 design · 0 competitors · 1 matchup')
    expectOrder(markup, [
      'Citrus bar',
      'Design A',
      'class="cb-masthead-vs"',
      'North Creamery',
      'North',
    ])
  })
})

describe('MastheadShelfPhoto', () => {
  it('uses a direct catalog src and otherwise the letter', () => {
    const photo = renderToStaticMarkup(
      createElement(MastheadShelfPhoto, {
        src: 'https://example.test/pint.png',
        letter: 'N',
      }),
    )
    const letter = renderToStaticMarkup(
      createElement(MastheadShelfPhoto, {
        imageRef: 'stimuli/citrus.png',
        letter: 'A',
      }),
    )

    expect(photo).toContain('src="https://example.test/pint.png"')
    expect(photo).not.toContain('cb-masthead-letter')
    expect(letter).toContain('cb-masthead-letter')
    expect(letter).toContain('>A<')
    expect(letter).not.toContain('<img')
    expect(letter).not.toContain('stimuli/citrus.png')
  })
})
