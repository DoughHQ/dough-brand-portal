import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ExperiencedReportDeck } from '@/components/experiencedReport/ExperiencedReportDeck'
import { parseExperiencedEnvelope } from '@/lib/experiencedReport/parse'
import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import { marketingBoxReportEnvelope } from '@/lib/marketing/boxReportFixture'

const LEGACY_SECTION_IDS = [
  'report-s1',
  'report-s2',
  'report-s3',
  'report-s4',
  'report-s5',
  'report-s6',
  'report-s7',
  'report-appendix',
] as const

function thinEnvelope(): ExperiencedReportEnvelope {
  const envelope = parseExperiencedEnvelope(
    {
      status: 'ok',
      report: {
        headline_win_rate: [],
        per_opponent: [],
        rank_validation: null,
        repurchase_intent: null,
        attribute_importance: null,
        choice_drivers: { by_outcome: {} },
        reliability: null,
        experience_lift_vs_baseline: null,
        participation: { n_users: 1, n_claims: 1, n_sessions: 1 },
        focal_product: { name: 'Best Garlic', brand: 'Acme', product_id: 42 },
        report_stage: { stage: 'final', completions_delivered: 0 },
      },
      mission_id: 'fa4fb97f-4e3f-44e7-8c99-cf553202e1f4',
    },
    'fa4fb97f-4e3f-44e7-8c99-cf553202e1f4',
  )
  if (!envelope) throw new Error('expected thin experienced envelope')
  return envelope
}

function legacyGridEnvelope(): ExperiencedReportEnvelope {
  const envelope = thinEnvelope()
  return {
    ...envelope,
    report: {
      ...envelope.report,
      ihut_core: { version: 'legacy' } as NonNullable<
        ExperiencedReportEnvelope['report']['ihut_core']
      >,
    },
  }
}

function html(envelope: ExperiencedReportEnvelope, variant?: 'preview') {
  return renderToStaticMarkup(
    createElement(ExperiencedReportDeck, { envelope, variant }),
  )
}

describe('ExperiencedReportDeck routing', () => {
  it('routes a current IHUT report to the evidence story', () => {
    const envelope = marketingBoxReportEnvelope()
    expect(envelope).not.toBeNull()
    const rendered = html(envelope!)

    expect(rendered).toContain('Evidence pack')
    expect(rendered).toContain('id="field"')
    for (const id of LEGACY_SECTION_IDS) {
      expect(rendered).not.toContain(`id="${id}"`)
    }
  })

  it('routes a report without IHUT data to the experienced story', () => {
    const rendered = html(thinEnvelope())

    expect(rendered).toContain('Experienced product report')
    expect(rendered).toContain('still forming')
    expect(rendered).not.toContain('Evidence pack')
    expect(rendered).not.toContain('experienced-report-frame')
    for (const id of LEGACY_SECTION_IDS) {
      expect(rendered).not.toContain(`id="${id}"`)
    }
  })

  it('keeps the legacy grid anchors when IHUT data is present but not current', () => {
    const rendered = html(legacyGridEnvelope())

    for (const id of LEGACY_SECTION_IDS) {
      expect(rendered).toContain(`id="${id}"`)
    }
    expect(rendered).toContain('experienced-report-frame')
    expect(rendered).not.toContain('Evidence pack')
  })

  it('crops the legacy preview to loyalty without the other grid sections', () => {
    const rendered = html(legacyGridEnvelope(), 'preview')

    expect(rendered).toContain('id="report-s5"')
    expect(rendered).toContain('Open full report preview')
    expect(rendered).not.toContain('experienced-report-frame')
    for (const id of LEGACY_SECTION_IDS.filter((id) => id !== 'report-s5')) {
      expect(rendered).not.toContain(`id="${id}"`)
    }
  })
})
