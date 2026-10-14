import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { OperatorStudyRow, WithdrawnStudyRow } from '@/lib/studies/types'
import DeleteStudyConfirm from '../DeleteStudyConfirm'

vi.mock('../../components/EndStudyDialog', () => ({
  default: function MockEndStudyDialog({
    open,
    title,
  }: {
    open: boolean
    title: string
  }) {
    if (!open) return null
    return (
      <div role="dialog">
        <h2>{`End “${title}”?`}</h2>
        <button type="button">End study</button>
      </div>
    )
  },
}))

import EndStudyConfirm from '../EndStudyConfirm'

function study(): OperatorStudyRow {
  return {
    mission_id: 'study-1',
    title: 'Oat carton',
    status: 'active',
    lifecycle_state: 'active',
    is_finished: false,
    brand_id: 7,
    brand_name: 'Maple',
    focal_product_id: null,
    focal_product_name: null,
    template_code: null,
    mission_type: 'concept_test',
    test_type: 'concept',
    session_count: 1,
    total_claims: 0,
    completed_claims: 0,
    target_completions: 30,
    created_at: '2026-01-01T00:00:00.000Z',
    expires_at: null,
  }
}

function withdrawn(): WithdrawnStudyRow {
  return {
    mission_id: 'withdrawn-1',
    title: 'Trashed oat',
    status: 'archived',
    is_draft: false,
    brand_id: 7,
    brand_name: 'Maple',
    focal_product_id: null,
    focal_product_name: null,
    template_code: null,
    total_claims: 0,
    completed_claims: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    deleted_at: '2026-02-01T00:00:00.000Z',
  }
}

describe('EndStudyConfirm', () => {
  it('stays closed until a study is chosen', () => {
    const markup = renderToStaticMarkup(
      <EndStudyConfirm
        row={null}
        onCancel={() => undefined}
        onError={() => undefined}
        onFinished={() => undefined}
      />,
    )
    expect(markup).toBe('')
  })

  it('opens the end-study dialog for a live study', () => {
    const markup = renderToStaticMarkup(
      <EndStudyConfirm
        row={study()}
        onCancel={() => undefined}
        onError={() => undefined}
        onFinished={() => undefined}
      />,
    )
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('End “Oat carton”?')
    expect(markup).toContain('>End study<')
  })
})

describe('DeleteStudyConfirm', () => {
  it('stays closed until a withdrawn study is chosen', () => {
    const markup = renderToStaticMarkup(
      <DeleteStudyConfirm row={null} busy={false} onCancel={() => undefined} onConfirm={() => undefined} />,
    )
    expect(markup).toBe('')
  })

  it('warns that delete cannot be undone', () => {
    const markup = renderToStaticMarkup(
      <DeleteStudyConfirm
        row={withdrawn()}
        busy={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    )
    const title = markup.indexOf('Delete forever?')
    const body = markup.indexOf('Permanently delete “Trashed oat”? This can&#x27;t be undone.')
    const action = markup.indexOf('>Delete forever<')
    expect(title).toBeGreaterThanOrEqual(0)
    expect(body).toBeGreaterThan(title)
    expect(action).toBeGreaterThan(body)
  })
})
