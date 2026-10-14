import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { OperatorStudyRow, WithdrawnStudyRow } from '@/lib/studies/types'
import type { StudyDraftListItem } from '../../drafts/actions'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: () => {} }),
}))
vi.mock('../../studiesPage.css', () => ({}))

import StudiesClient from '../../StudiesClient'

function study(partial: Partial<OperatorStudyRow>): OperatorStudyRow {
  return {
    mission_id: 'm1',
    title: 'Oat carton',
    status: 'active',
    lifecycle_state: 'active',
    is_finished: false,
    brand_id: 4,
    brand_name: 'Maple',
    focal_product_id: null,
    focal_product_name: null,
    template_code: null,
    test_type: 'concept',
    total_claims: 0,
    completed_claims: 0,
    target_completions: 10,
    created_at: '2026-01-01T00:00:00Z',
    expires_at: null,
    ...partial,
  }
}

function client(partial: Partial<Parameters<typeof StudiesClient>[0]> = {}) {
  return createElement(StudiesClient, {
    initialActive: [],
    initialActiveHasMore: false,
    initialActiveCursor: null,
    initialComplete: [],
    initialCompleteHasMore: false,
    initialCompleteCursor: null,
    withdrawn: [],
    drafts: [] as StudyDraftListItem[],
    effectiveBrandId: 4,
    canOperate: false,
    canEndStudies: false,
    ...partial,
  })
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('StudiesClient', () => {
  it('sorts active studies newest first and complete studies by bucket', () => {
    const markup = renderToStaticMarkup(
      client({
        canOperate: true,
        initialActiveHasMore: true,
        initialCompleteHasMore: true,
        initialActive: [
          study({
            mission_id: 'older',
            title: 'January keel',
            brand_id: 9,
            brand_name: 'Oatly',
            created_at: '2026-01-01T00:00:00Z',
          }),
          study({
            mission_id: 'newer',
            title: 'June oat',
            brand_id: 4,
            brand_name: 'Maple',
            created_at: '2026-06-01T00:00:00Z',
          }),
        ],
        initialComplete: [
          study({
            mission_id: 'archived',
            title: 'August archive',
            status: 'archived',
            lifecycle_state: 'archived',
            is_finished: true,
            created_at: '2026-08-01T00:00:00Z',
          }),
          study({
            mission_id: 'expired',
            title: 'July expired',
            status: 'expired',
            lifecycle_state: 'expired',
            is_finished: true,
            created_at: '2026-07-01T00:00:00Z',
          }),
          study({
            mission_id: 'older-done',
            title: 'February done',
            status: 'completed',
            lifecycle_state: 'completed',
            is_finished: true,
            created_at: '2026-02-01T00:00:00Z',
          }),
          study({
            mission_id: 'newer-done',
            title: 'May done',
            status: 'completed',
            lifecycle_state: 'completed',
            is_finished: true,
            created_at: '2026-05-01T00:00:00Z',
          }),
        ],
      }),
    )

    expectOrder(markup, [
      'June oat',
      'Concept field · Maple',
      'January keel',
      'Concept field · Oatly',
      '>Load more<',
      'Drafts',
      'No drafts.',
      'Completed',
      'May done',
      'February done',
      'July expired',
      'August archive',
      '>Load more<',
    ])
  })

  it('hides brand names when every study belongs to one brand', () => {
    const markup = renderToStaticMarkup(
      client({
        initialActive: [
          study({ mission_id: 'a', title: 'June oat' }),
          study({ mission_id: 'b', title: 'January keel', brand_name: 'Maple' }),
        ],
      }),
    )

    expect(markup).toContain('June oat')
    expect(markup).toContain('January keel')
    expect(markup).not.toContain('Maple')
    expect(markup).not.toContain('>Load more<')
  })

  it('keeps the archive closed and shows an empty list with its load error', () => {
    const withdrawn: WithdrawnStudyRow = {
      mission_id: 'gone',
      title: 'Pulled study',
      status: 'withdrawn',
      is_draft: false,
      brand_id: 4,
      brand_name: 'Maple',
      focal_product_id: null,
      focal_product_name: null,
      template_code: null,
      total_claims: 0,
      completed_claims: 0,
      created_at: '2026-03-01T00:00:00Z',
      deleted_at: '2026-04-01T00:00:00Z',
    }
    const markup = renderToStaticMarkup(
      client({
        canOperate: true,
        withdrawn: [withdrawn],
        loadError: 'Could not load studies.',
      }),
    )

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Could not load studies.')
    expect(markup).toContain('Archived studies')
    expect(markup).toContain('(1)')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).not.toContain('id="archived-studies-panel"')
    expect(markup).not.toContain('Pulled study')
    expect(markup).toContain('No active studies right now')
    expect(markup).toContain('No completed studies yet.')
    expect(markup).toContain('No drafts.')
  })
})
