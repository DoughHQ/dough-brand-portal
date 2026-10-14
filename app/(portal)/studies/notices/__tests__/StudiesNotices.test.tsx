import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { OperatorStudyRow } from '@/lib/studies/types'
import StudiesErrorBanner from '../StudiesErrorBanner'
import StudiesToast, { type ToastState } from '../StudiesToast'

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
    test_type: 'concept',
    total_claims: 0,
    completed_claims: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    expires_at: null,
  }
}

describe('StudiesToast', () => {
  it('shows a plain notice without undo', () => {
    const toast: ToastState = { kind: 'plain', message: 'Draft saved.' }
    const markup = renderToStaticMarkup(
      <StudiesToast toast={toast} busyId={null} pending={false} onUndo={() => undefined} />,
    )

    expect(markup).toContain('role="status"')
    expect(markup).toContain('Draft saved.')
    expect(markup).not.toContain('>Undo<')
  })

  it('puts undo after a withdraw notice', () => {
    const toast: ToastState = {
      kind: 'withdraw_undo',
      message: 'Study withdrawn.',
      missionId: 'study-1',
      studySnapshot: study(),
    }
    const markup = renderToStaticMarkup(
      <StudiesToast toast={toast} busyId={null} pending={false} onUndo={() => undefined} />,
    )

    const message = markup.indexOf('Study withdrawn.')
    const undo = markup.indexOf('>Undo<')
    expect(markup).toContain('role="status"')
    expect(undo).toBeGreaterThan(message)
    expect(markup).not.toContain('disabled')
  })

  it('disables undo while the restore is busy', () => {
    const toast: ToastState = {
      kind: 'withdraw_undo',
      message: 'Study withdrawn.',
      missionId: 'study-1',
      studySnapshot: study(),
    }
    const markup = renderToStaticMarkup(
      <StudiesToast toast={toast} busyId="study-1" pending={false} onUndo={() => undefined} />,
    )

    expect(markup).toContain('disabled=""')
  })
})

describe('StudiesErrorBanner', () => {
  it('shows the error as an alert', () => {
    const markup = renderToStaticMarkup(<StudiesErrorBanner message="Could not load studies." />)

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Could not load studies.')
    expect(markup).not.toContain('role="status"')
  })
})
