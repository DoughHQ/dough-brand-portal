import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { OperatorStudyRow, WithdrawnStudyRow } from '@/lib/studies/types'
import CloseStudyConfirm from '../CloseStudyConfirm'
import DeleteStudyConfirm from '../DeleteStudyConfirm'

function study(totalClaims: number, completedClaims: number): OperatorStudyRow {
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
    total_claims: totalClaims,
    completed_claims: completedClaims,
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

describe('CloseStudyConfirm', () => {
  it('stays closed until a study is chosen', () => {
    const markup = renderToStaticMarkup(
      <CloseStudyConfirm row={null} busy={false} onCancel={() => undefined} onConfirm={() => undefined} />,
    )

    expect(markup).toBe('')
  })

  it('marks a study with no one in progress as completed', () => {
    const markup = renderToStaticMarkup(
      <CloseStudyConfirm
        row={study(0, 0)}
        busy={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    )

    const title = markup.indexOf('Close study?')
    const body = markup.indexOf('“Oat carton” will mark as completed.')
    const action = markup.indexOf('>Close study<')
    expect(markup).toContain('role="dialog"')
    expect(body).toBeGreaterThan(title)
    expect(action).toBeGreaterThan(body)
    expect(markup).not.toContain('respondent')
  })

  it('names one in-progress respondent', () => {
    const markup = renderToStaticMarkup(
      <CloseStudyConfirm
        row={study(1, 0)}
        busy={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    )

    expect(markup).toContain('This will stop up to')
    expect(markup).toContain('>1<')
    expect(markup).toContain('respondent for “')
    expect(markup).toContain('Oat carton')
    expect(markup).not.toContain('respondents')
  })

  it('pluralizes several in-progress respondents', () => {
    const markup = renderToStaticMarkup(
      <CloseStudyConfirm
        row={study(3, 1)}
        busy={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    )

    expect(markup).toContain('>2<')
    expect(markup).toContain('respondents for “')
  })

  it('shows working while the close is busy', () => {
    const markup = renderToStaticMarkup(
      <CloseStudyConfirm
        row={study(0, 0)}
        busy
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    )

    expect(markup).toContain('Working…')
    expect(markup).toContain('disabled=""')
    expect(markup).not.toContain('>Close study<')
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
