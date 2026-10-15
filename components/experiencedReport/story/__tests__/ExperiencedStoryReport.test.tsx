import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ExperiencedStoryReport } from '../../ExperiencedStoryReport'
import { IntentChapter } from '../IntentChapter'
import { repurchaseSessions } from '../RepurchaseChart'
import { movementTitle, pct } from '../storyFormat'
import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import { marketingBoxReportEnvelope } from '@/lib/marketing/boxReportFixture'

function richEnvelope(): ExperiencedReportEnvelope {
  const box = marketingBoxReportEnvelope()
  if (!box) throw new Error('expected marketing box fixture')
  return {
    ...box,
    report: {
      ...box.report,
      experience_lift_vs_baseline: {
        reportable: true,
        mean_elo_delta: 12.34,
        n_moved_up: 5,
        n_unchanged: null,
        n_moved_down: 2,
      },
      rank_validation: {
        by_pair_class: [
          { pair_class: 'close_call', reportable: true, agreement_rate: 0.71 },
          { pair_class: 'clear_gap', reportable: false, agreement_rate: null },
        ],
      },
      reliability: { reportable: true, consistency_rate: 0.83 },
      methodology: { sampling: 'Random households', weighting: '' },
    },
  } as unknown as ExperiencedReportEnvelope
}

function inOrder(html: string, needles: string[]) {
  let cursor = 0
  for (const needle of needles) {
    const at = html.indexOf(needle, cursor)
    expect(at, needle).toBeGreaterThanOrEqual(0)
    cursor = at + needle.length
  }
}

describe('ExperiencedStoryReport shell', () => {
  it('renders every chapter in order for the full variant', () => {
    const html = renderToStaticMarkup(
      createElement(ExperiencedStoryReport, { envelope: richEnvelope(), backHref: '/reports' }),
    )
    inOrder(html, [
      'Experienced product report · Decision brief',
      'id="performance"',
      'id="why"',
      'Choice reasons',
      'id="intent"',
      'Preference movement',
      '+',
      '12.3',
      'Moved up',
      'Unchanged',
      'Moved down',
      'id="price"',
      'id="evidence"',
      '83% repeat-choice reliability',
      'Ranking validation detail',
      'Close call',
      '71%',
      'Clear gap',
      'Withheld',
      'id="method"',
      'Decision scope',
      'Comparison discipline',
      'Sampling',
      'Random households',
    ])
    expect(html).not.toContain('>Weighting<')
  })

  it('keeps only the brief and footer for the preview variant', () => {
    const html = renderToStaticMarkup(
      createElement(ExperiencedStoryReport, {
        envelope: richEnvelope(),
        backHref: '/reports',
        variant: 'preview',
      }),
    )
    expect(html).toContain('Experienced product report · Decision brief')
    for (const id of ['performance', 'why', 'intent', 'evidence', 'method']) {
      expect(html).not.toContain(`id="${id}"`)
    }
  })
})

describe('story pieces', () => {
  it('collapses preference movement when it is not reportable', () => {
    const envelope = richEnvelope()
    const withoutLift = {
      ...envelope,
      report: { ...envelope.report, experience_lift_vs_baseline: null },
    } as unknown as ExperiencedReportEnvelope
    const html = renderToStaticMarkup(
      createElement(IntentChapter, {
        envelope: withoutLift,
        repurchaseTitle: 'Buy-again intent is not reportable yet.',
        sessions: repurchaseSessions([]),
        sessionRows: [],
      }),
    )
    expect(html).toContain('Buy-again intent is not reportable yet.')
    expect(html).toContain('0 reportable sessions')
    inOrder(html, ['<strong>Preference movement · </strong>', 'Not reportable yet'])
    expect(movementTitle(withoutLift)).toBe('Preference movement is not reportable yet.')
  })

  it('formats shares with the em dash fallback', () => {
    expect(pct(0.425)).toBe('43%')
    expect(pct(null)).toBe('—')
  })
})
