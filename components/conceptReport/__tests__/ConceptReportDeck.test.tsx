import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  conceptReportFixture,
  conceptReportThinSampleFixture,
} from '@/lib/conceptReport/fixture'
import {
  ConceptReportDeck,
  ConceptReportMemo,
} from '../ConceptReportDeck'

function expectOrder(html: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = html.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

function between(html: string, start: string, end: string) {
  const startIndex = html.indexOf(start)
  const endIndex = html.indexOf(end, startIndex + start.length)
  expect(startIndex).toBeGreaterThan(-1)
  expect(endIndex).toBeGreaterThan(startIndex)
  return html.slice(startIndex, endIndex)
}

describe('ConceptReportDeck', () => {
  it('preserves the complete report sequence and compatibility export', () => {
    const html = renderToStaticMarkup(
      createElement(ConceptReportDeck, {
        report: conceptReportFixture(),
        backHref: '/return',
      }),
    )

    expect(ConceptReportMemo).toBe(ConceptReportDeck)
    expect(html).toContain('href="/return"')
    expect(html).toContain('class="concept-report-deck"')
    expect(html).toMatch(/background:\s*var\(--surface\)/)
    expect(html).toMatch(/min-height:\s*100vh/)
    expect(html).toMatch(/max-width:\s*920px/)
    expect(html).toMatch(/linear-gradient\(165deg,\s*#fffdf8/)
    expect(html).not.toContain('concept-report-simulated-banner')
    expectOrder(html, [
      'class="deck-cold-open"',
      'Sparkling lemonade — three concepts vs shelf',
      'class="deck-verdict-grid"',
      'What to do next',
      'The field',
      'Why it played that way',
      'class="deck-enter-ladder"',
      'How often each one wins',
      'What respondents told you',
      'What most drew you to the one you chose?',
      'Would you buy this if you saw it on shelf at this price?',
      'How often do you buy sparkling beverages?',
      'class="deck-trust-details"',
      'Evidence quality',
    ])
    expectOrder(
      between(
        html,
        'What most drew you to the one you chose?',
        'Would you buy this if you saw it on shelf at this price?',
      ),
      ['health', 'taste', 'price', 'packaging'],
    )
    expectOrder(
      between(
        html,
        'Would you buy this if you saw it on shelf at this price?',
        'How often do you buy sparkling beverages?',
      ),
      ['maybe', 'yes', 'no'],
    )
  })

  it('keeps thin-sample honesty outside walkthrough sample mode', () => {
    const report = conceptReportThinSampleFixture()
    const liveHtml = renderToStaticMarkup(
      createElement(ConceptReportDeck, { report }),
    )
    const sampleHtml = renderToStaticMarkup(
      createElement(ConceptReportDeck, { report, sampleMode: true }),
    )

    expect(liveHtml).toContain('concept-report-thin-banner')
    expect(liveHtml).toContain('Treat rankings as directional only')
    expect(liveHtml).toMatch(/background:\s*var\(--amber-soft\)/)
    expect(liveHtml).toContain('Provisional read')
    expect(sampleHtml).not.toContain('concept-report-thin-banner')
    expect(sampleHtml).toContain('Provisional read')
  })

  it('suppresses the simulated banner only while framing a walkthrough sample', () => {
    const report = { ...conceptReportThinSampleFixture(), is_simulated: true }
    const liveHtml = renderToStaticMarkup(
      createElement(ConceptReportDeck, { report }),
    )
    const sampleHtml = renderToStaticMarkup(
      createElement(ConceptReportDeck, { report, sampleMode: true }),
    )

    expect(liveHtml).toContain('concept-report-simulated-banner')
    expect(liveHtml).toContain('Simulated — demo data')
    expect(liveHtml).toContain('synthetic respondents')
    expect(liveHtml).toMatch(/background:\s*var\(--bg-warning\)/)
    expect(liveHtml).toContain('concept-report-thin-banner')
    expect(sampleHtml).not.toContain('concept-report-simulated-banner')
    expect(sampleHtml).not.toContain('Simulated — demo data')
    expect(sampleHtml).not.toContain('concept-report-thin-banner')
    expect(sampleHtml).toContain('Provisional read')
  })
})
