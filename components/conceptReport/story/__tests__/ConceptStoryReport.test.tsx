import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ConceptTestReportDeck } from '../../ConceptStoryReport'
import { ChoiceChapter } from '../ChoiceChapter'
import { brandQuestionFinding, pct, resultLabel } from '../storyFormat'
import {
  parseConceptTestReport,
  type ConceptTestReport,
} from '@/lib/conceptReport/conceptTestTypes'
import fixture from '../../../../concept-core-fixtures/report_concept_test.json'

function fullReport(): ConceptTestReport {
  const report = parseConceptTestReport(fixture)
  if (!report) throw new Error('expected concept test fixture')
  return report
}

function inOrder(html: string, needles: string[]) {
  let cursor = 0
  for (const needle of needles) {
    const at = html.indexOf(needle, cursor)
    expect(at, needle).toBeGreaterThanOrEqual(0)
    cursor = at + needle.length
  }
}

describe('ConceptTestReportDeck shell', () => {
  it('renders the decision and every chapter in order', () => {
    const html = renderToStaticMarkup(
      createElement(ConceptTestReportDeck, { report: fullReport(), backHref: '/studies' }),
    )
    inOrder(html, [
      'Concept test · Decision brief',
      'id="decision"',
      'Decision discipline',
      'id="first-look"',
      'Full first-look distribution',
      'id="why"',
      'Stated vs chosen',
      'id="price"',
      'Demand curve',
      'id="voices"',
      'id="method"',
      'Sample accounting',
      'Concept decision report',
    ])
  })

  it('renders the still-forming brief without a verdict', () => {
    const html = renderToStaticMarkup(
      createElement(ConceptTestReportDeck, {
        report: { ...fullReport(), verdict: [] },
        backHref: '/studies',
      }),
    )
    expect(html).toContain('The concept verdict is still forming.')
    expect(html).not.toContain('id="decision"')
  })
})

describe('concept story pieces', () => {
  it('withholds the priority ranking and agreement when evidence is missing', () => {
    const html = renderToStaticMarkup(
      createElement(ChoiceChapter, {
        report: { ...fullReport(), what_matters: null, stated_vs_chosen: null },
      }),
    )
    inOrder(html, [
      'We do not yet know which design elements mattered most.',
      'No priority ranking is shown',
      'Stated and observed choice agreement is not available yet.',
      'No comparable rankings yet.',
    ])
  })

  it('formats shares, verdict labels, and brand question leaders', () => {
    expect(pct(0.4567)).toBe('45.7%')
    expect(pct(null)).toBe('—')
    expect(resultLabel('not_cleared')).toBe('Did not clear')
    expect(
      brandQuestionFinding({
        prompt: 'Pick one',
        brand_written: true,
        n: 5,
        options: [
          { option: 'Red', n: 2 },
          { option: 'Blue', n: 2 },
          { option: 'Green', n: 1 },
        ],
      } as unknown as ConceptTestReport['brand_questions'][number]),
    ).toBe('Red, Blue tied at 2 each.')
  })
})
