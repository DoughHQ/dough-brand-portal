import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import * as DecisionBrief from '../../DecisionBrief'
import { deriveOverviewBrief } from '@/lib/experiencedReport/overviewBrief'
import { marketingBoxReportEnvelope } from '@/lib/marketing/boxReportFixture'

function overview() {
  const envelope = marketingBoxReportEnvelope()
  if (!envelope) throw new Error('expected marketing box fixture')
  return deriveOverviewBrief(envelope)
}

describe('DecisionBrief facade', () => {
  it('keeps the public component surface', () => {
    expect(Object.keys(DecisionBrief).sort()).toEqual([
      'DecisionBriefHeader',
      'EvidenceStrip',
      'HeadToHeadForest',
      'OverviewBottomLine',
      'PreferenceIntervalBar',
    ])
  })

  it('renders the bottom line with eyebrow and metadata', () => {
    const brief = overview()
    const html = renderToStaticMarkup(
      createElement(DecisionBrief.OverviewBottomLine, {
        overview: brief,
        eyebrow: 'Experienced product report · Decision brief',
        metadata: ['Brand · Acme', 'Final read'],
      }),
    )
    expect(html).toContain('Experienced product report · Decision brief')
    expect(html.indexOf('Brand · Acme')).toBeLessThan(html.indexOf('Final read'))
  })

  it('keeps the deprecated header as a pass-through to the bottom line', () => {
    const brief = overview()
    const props = { overview: brief, eyebrow: 'Eyebrow', metadata: ['One'] }
    expect(renderToStaticMarkup(createElement(DecisionBrief.DecisionBriefHeader, props))).toBe(
      renderToStaticMarkup(createElement(DecisionBrief.OverviewBottomLine, props)),
    )
  })

  it('renders the evidence strip values', () => {
    const html = renderToStaticMarkup(
      createElement(DecisionBrief.EvidenceStrip, {
        rankingPct: '71%',
        compositionPct: null,
        reliabilityNote: '83% repeat-choice reliability',
      }),
    )
    expect(html).toContain('71%')
    expect(html).toContain('83% repeat-choice reliability')
  })

  it('renders the head-to-head forest with the favored label', () => {
    const brief = overview()
    const html = renderToStaticMarkup(
      createElement(DecisionBrief.HeadToHeadForest, {
        field: brief.field,
        productName: brief.productName,
        favoredLabel: 'Preferred in 3 of 4 named comparisons.',
      }),
    )
    expect(html).toContain('Preferred in 3 of 4 named comparisons.')
  })
})
