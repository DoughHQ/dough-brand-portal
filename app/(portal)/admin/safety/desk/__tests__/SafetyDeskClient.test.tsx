import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import SafetyDeskClient from '../../SafetyDeskClient'

vi.mock('../../safetyDesk.css', () => ({}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}))
vi.mock('../../actions', () => ({
  getSafetyReportAction: vi.fn(),
  moderateSafetyReportAction: vi.fn(),
  reinstateUserAction: vi.fn(),
}))

describe('SafetyDeskClient', () => {
  it('renders a clear inbox', () => {
    const html = renderToStaticMarkup(
      <SafetyDeskClient
        initialRows={[]}
        initialTotal={0}
        focusId={null}
        loadError={null}
        renderedAt={Date.parse('2026-10-11T12:00:00.000Z')}
      />,
    )
    expect(html).toContain('Inbox clear')
    expect(html).toContain('Oct 11, 2026 · 12:00 PM UTC')
    expect(html).toContain('No open reports. Nice.')
    expect(html).toContain('Select a case.')
  })

  it('shows a load error banner', () => {
    const html = renderToStaticMarkup(
      <SafetyDeskClient
        initialRows={[]}
        initialTotal={0}
        focusId={null}
        loadError="Desk unavailable"
        renderedAt={0}
      />,
    )
    expect(html).toContain('safety-banner-error')
    expect(html).toContain('Desk unavailable')
  })
})
