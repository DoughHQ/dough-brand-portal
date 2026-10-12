import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { OperatorStudyRow } from '@/lib/studies/types'
import {
  ActiveStudyList,
  CompletedSectionHead,
  CompletedStudyList,
  DraftsSectionHead,
  InProgressEmpty,
  InProgressSectionHead,
} from '../../StudyLifecycleLists'

function row(partial: Partial<OperatorStudyRow> = {}): OperatorStudyRow {
  return {
    mission_id: 'm1',
    title: 'Midnight Cocoa',
    status: 'active',
    lifecycle_state: 'active',
    is_finished: false,
    brand_id: 1,
    brand_name: 'Odwalla',
    focal_product_id: 99,
    focal_product_name: 'Fruit Smoothie Blend',
    template_code: null,
    mission_type: 'product_discovery',
    test_type: 'ihut',
    session_count: 1,
    total_claims: 10,
    completed_claims: 4,
    target_completions: 20,
    created_at: '2026-08-01T00:00:00Z',
    expires_at: null,
    ...partial,
  }
}

const listActions = {
  canOperate: false,
  busyId: null,
  pending: false,
  showBrand: false,
  onClose: () => {},
  onWithdraw: () => {},
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('StudyLifecycleLists', () => {
  it('heads the three study sections and invites a new study when none are active', () => {
    const heads = [
      renderToStaticMarkup(createElement(InProgressSectionHead)),
      renderToStaticMarkup(createElement(DraftsSectionHead)),
      renderToStaticMarkup(createElement(CompletedSectionHead)),
    ].join('')
    const empty = renderToStaticMarkup(createElement(InProgressEmpty))

    expectOrder(heads, ['In progress', 'Drafts', 'Completed'])
    expect(empty).toContain('class="studies-empty-active"')
    expectOrder(empty, [
      'No active studies right now',
      'Start a new study when you want focused feedback from qualified consumers.',
      'href="/studies/new"',
      'New study',
    ])
  })

  it('shows iHUT progress, a second session, and the report link', () => {
    const markup = renderToStaticMarkup(
      createElement(ActiveStudyList, {
        ...listActions,
        showBrand: true,
        rows: [row({ session_count: 2 })],
      }),
    )

    expect(markup).toContain('class="studies-study-row studies-study-row--active"')
    expect(markup).toContain('width:20%')
    expect(markup).not.toContain('studies-kebab')
    const openEnded = renderToStaticMarkup(
      createElement(ActiveStudyList, {
        ...listActions,
        rows: [row({ completed_claims: 3, target_completions: 0 })],
      }),
    )
    expect(openEnded).toContain('3 completed')
    expect(openEnded).not.toContain('studies-progress-track')
    expectOrder(markup, [
      'Midnight Cocoa',
      'iHUT',
      '2 sessions',
      'Fruit Smoothie Blend',
      'Odwalla',
      '4 / 20 participants',
      'href="/reports/m1"',
      'View report →',
    ])
  })

  it('sends an unpaid concept study to checkout instead of the in-review wording', () => {
    const markup = renderToStaticMarkup(
      createElement(ActiveStudyList, {
        ...listActions,
        rows: [
          row({
            mission_id: 'concept-1',
            title: 'Spring pack',
            test_type: 'concept',
            mission_type: 'concept_test',
            lifecycle_state: 'in_review',
            status: 'draft',
            focal_product_name: null,
            order_status: 'awaiting_payment',
            completed_claims: 0,
            target_completions: null,
          }),
        ],
      }),
    )

    expect(markup).toContain('Awaiting payment')
    expect(markup).toContain('href="/studies/concept-1/checkout"')
    expect(markup).toContain('Checkout →')
    expect(markup).toContain('Concept field')
    expect(markup).toContain('No responses yet')
    expect(markup).not.toContain('studies-progress-track')
    expect(markup).not.toContain('In review: Dough is checking your wording')
    expect(markup).not.toContain('View report →')
  })

  it('keeps a paid concept in review on its report, and shows Dough review for other studies', () => {
    const live = renderToStaticMarkup(
      createElement(ActiveStudyList, {
        ...listActions,
        rows: [
          row({
            mission_id: 'concept-2',
            test_type: 'concept',
            mission_type: 'concept_test',
            lifecycle_state: 'in_review',
            order_status: 'paid',
          }),
        ],
      }),
    )
    const review = renderToStaticMarkup(
      createElement(ActiveStudyList, {
        ...listActions,
        rows: [
          row({
            mission_id: 'box-1',
            test_type: 'ihut',
            lifecycle_state: 'in_review',
          }),
        ],
      }),
    )
    const paused = renderToStaticMarkup(
      createElement(ActiveStudyList, {
        ...listActions,
        canOperate: true,
        rows: [row({ lifecycle_state: 'paused', title: '' })],
      }),
    )

    expect(live).toContain('Live')
    expect(live).toContain('href="/studies/concept/concept-2/report"')
    expect(live).toContain('View report →')
    expect(live).not.toContain('Awaiting payment')
    expect(review).toContain('title="Awaiting Dough review"')
    expect(review).toContain('In review: Dough is checking your wording')
    expect(paused).toContain('Paused')
    expect(paused).toContain('iHUT · Odwalla')
    expect(paused).toContain('class="studies-kebab"')
    expect(paused).not.toContain('Close study')
  })

  it('counts completed responses and marks expired or archived studies', () => {
    const done = renderToStaticMarkup(
      createElement(CompletedStudyList, {
        ...listActions,
        canOperate: true,
        rows: [
          row({
            mission_id: 'done-1',
            lifecycle_state: 'completed',
            is_finished: true,
            status: 'completed',
            completed_claims: 18,
            target_completions: null,
          }),
        ],
      }),
    )
    const expired = renderToStaticMarkup(
      createElement(CompletedStudyList, {
        ...listActions,
        rows: [
          row({
            mission_id: 'concept-3',
            title: 'Old pack',
            test_type: 'concept',
            mission_type: 'concept_test',
            lifecycle_state: 'expired',
            status: 'expired',
            is_finished: true,
            completed_claims: Number.NaN,
          }),
        ],
      }),
    )
    const archived = renderToStaticMarkup(
      createElement(CompletedStudyList, {
        ...listActions,
        rows: [
          row({
            title: '',
            mission_type: 'brand_challenge',
            test_type: null,
            lifecycle_state: 'archived',
            status: 'archived',
            is_finished: true,
            focal_product_name: null,
            completed_claims: 3,
            target_completions: 0,
          }),
        ],
      }),
    )

    expect(done).toContain('class="studies-study-row studies-study-row--completed"')
    expect(done).toContain('class="studies-kebab"')
    expect(done).toContain('href="/reports/done-1"')
    expect(done).not.toContain('Expired')
    expect(done).not.toContain('Archived')
    expectOrder(done, ['Midnight Cocoa', 'Responses', '18', 'View results →'])
    expect(expired).toContain('Expired')
    expect(expired).toContain('href="/studies/concept/concept-3/report"')
    expect(expired).toContain('>0<')
    expect(archived).toContain('Archived')
    expect(archived).toContain('Challenge · Odwalla')
    expect(archived).toContain('Product pending')
    expect(archived).toContain('>3<')
  })
})
