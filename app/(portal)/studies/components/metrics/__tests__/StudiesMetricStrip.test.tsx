import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { OperatorStudyLifecycleState, OperatorStudyRow } from '@/lib/studies/types'
import StudiesMetricStrip from '../../StudiesMetricStrip'
import { computeStudyMetrics } from '../computeStudyMetrics'

function row(
  lifecycle: OperatorStudyLifecycleState,
  completedClaims: number,
  target: number | null = null,
): OperatorStudyRow {
  return {
    mission_id: `${lifecycle}-${completedClaims}-${target ?? 'none'}`,
    title: 'Oat carton',
    status: 'active',
    lifecycle_state: lifecycle,
    is_finished: false,
    brand_id: 7,
    brand_name: 'Maple',
    focal_product_id: null,
    focal_product_name: null,
    template_code: null,
    total_claims: completedClaims,
    completed_claims: completedClaims,
    target_completions: target,
    created_at: '2026-01-01T00:00:00.000Z',
    expires_at: null,
  }
}

describe('computeStudyMetrics', () => {
  it('counts live studies, responses, and average completion', () => {
    const metrics = computeStudyMetrics([
      row('active', 5, 10),
      row('paused', 10, 10),
      row('scheduled', 0, null),
      row('in_review', 1, null),
      row('completed', 3, null),
      row('draft', 2, null),
    ])

    expect(metrics).toEqual({
      active: 4,
      responses: 21,
      drafts: 1,
      avgCompletion: 75,
    })
  })

  it('ignores a non-finite response count', () => {
    const metrics = computeStudyMetrics([row('active', Number.NaN, null)])

    expect(metrics.active).toBe(1)
    expect(metrics.responses).toBe(0)
  })

  it('withholds average completion until two targets exist', () => {
    expect(computeStudyMetrics([row('active', 5, 10)]).avgCompletion).toBeNull()
    expect(computeStudyMetrics([row('active', 5, 0)]).avgCompletion).toBeNull()
  })
})

describe('StudiesMetricStrip', () => {
  it('puts active studies ahead of drafts, completed, and responses', () => {
    const markup = renderToStaticMarkup(
      <StudiesMetricStrip
        rows={[row('active', 5, 10), row('draft', 2, null)]}
        draftCount={8}
        completedCount={4}
      />,
    )

    expect(markup).toContain('class="studies-metric-strip"')
    expect(markup).toContain('class="studies-metric-card"')
    const active = markup.indexOf('Active studies')
    const activeValue = markup.indexOf('>1<')
    const drafts = markup.indexOf('Drafts')
    const draftValue = markup.indexOf('>8<')
    const completed = markup.indexOf('Completed')
    const completedValue = markup.indexOf('>4<')
    const responses = markup.indexOf('Responses collected')
    const responseValue = markup.indexOf('>7<', responses)
    expect(active).toBeGreaterThanOrEqual(0)
    expect(activeValue).toBeGreaterThan(active)
    expect(drafts).toBeGreaterThan(activeValue)
    expect(draftValue).toBeGreaterThan(drafts)
    expect(completed).toBeGreaterThan(draftValue)
    expect(completedValue).toBeGreaterThan(completed)
    expect(responses).toBeGreaterThan(completedValue)
    expect(responseValue).toBeGreaterThan(responses)
  })
})
