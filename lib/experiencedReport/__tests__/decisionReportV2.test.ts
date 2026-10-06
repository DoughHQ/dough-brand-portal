import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { IhutStoryReport } from '@/components/experiencedReport/IhutStoryReport'
import { ExperiencedStoryReport } from '@/components/experiencedReport/ExperiencedStoryReport'
import { deriveDecisionStory } from '@/lib/experiencedReport/decisionStory'
import {
  marketingBoxReportEnvelope,
  marketingBoxReportThinEnvelope,
} from '@/lib/marketing/boxReportFixture'
import { isIhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'

describe('Report V2 decision chapters', () => {
  it('parses rich IHUT fixture with full price contract', () => {
    const envelope = marketingBoxReportEnvelope()
    expect(envelope).not.toBeNull()
    const story = deriveDecisionStory(envelope!)
    expect(story.family).toBe('ihut_core')
    expect(story.price.measured).toBe(true)
    expect(story.price.day1.length).toBeGreaterThan(0)
    expect(story.price.day1[0]?.testedPriceDollars).toBe(3.49)
    expect(story.price.transitions[0]?.nPaired).toBe(40)
    expect(story.price.valueLeakage[0]?.share).toBeCloseTo(0.212)
    expect(story.chapters).toEqual([
      'decision',
      'field',
      'diagnosis',
      'price',
      'durability',
      'trust',
    ])
  })

  it('keeps thin IHUT fixture honest when price checks are off', () => {
    const envelope = marketingBoxReportThinEnvelope()
    expect(envelope).not.toBeNull()
    const story = deriveDecisionStory(envelope!)
    expect(story.price.enabled).toBe(false)
    expect(story.price.claims.some((c) => c.id === 'price-disabled')).toBe(true)
    expect(story.price.day1).toEqual([])
  })

  it('SSR-renders rich and thin IHUT story reports', () => {
    const rich = marketingBoxReportEnvelope()
    const thin = marketingBoxReportThinEnvelope()
    expect(rich?.report.ihut_core && isIhutCoreReport(rich.report.ihut_core)).toBe(
      true,
    )
    expect(thin?.report.ihut_core && isIhutCoreReport(thin.report.ihut_core)).toBe(
      true,
    )

    const richHtml = renderToString(
      createElement(IhutStoryReport, {
        envelope: rich!,
        report: rich!.report.ihut_core!,
        backHref: '/studies',
      }),
    )
    expect(richHtml).toContain('Price')
    expect(richHtml).toContain('tested-offer intent')
    expect(richHtml).toContain('$3.49')
    expect(richHtml).toContain('Value leakage')

    const thinHtml = renderToString(
      createElement(IhutStoryReport, {
        envelope: thin!,
        report: thin!.report.ihut_core!,
        backHref: '/studies',
      }),
    )
    expect(thinHtml).toContain('Price checks were off')
    expect(thinHtml).not.toContain('Value leakage')
  })

  it('SSR-renders legacy experienced report with not-measured price chapter', () => {
    const envelope = marketingBoxReportEnvelope()
    // Force legacy path by clearing ihut_core for this assertion surface.
    const legacy = {
      ...envelope!,
      report: {
        ...envelope!.report,
        ihut_core: null,
      },
    }
    const story = deriveDecisionStory(legacy)
    expect(story.family).toBe('legacy_experienced')
    expect(story.price.label).toBe('not_measured')

    const html = renderToString(
      createElement(ExperiencedStoryReport, {
        envelope: legacy,
        backHref: '/studies',
      }),
    )
    expect(html).toContain('The bottom line')
    expect(html).toContain('No tested shelf-price intent was measured')
  })
})
