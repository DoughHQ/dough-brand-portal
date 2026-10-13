import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ResumeDraftBanner from '../../ResumeDraftBanner'

function renderBanner(
  overrides: Partial<Parameters<typeof ResumeDraftBanner>[0]> = {},
) {
  return renderToStaticMarkup(
    <ResumeDraftBanner
      title="Maple oat milk"
      whenLabel="2 hours ago"
      onResume={() => undefined}
      onStartFresh={() => undefined}
      {...overrides}
    />,
  )
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('ResumeDraftBanner', () => {
  it('offers the saved draft with start fresh then resume', () => {
    const markup = renderBanner()

    expect(markup).toContain('role="region"')
    expect(markup).toContain('aria-label="Resume draft"')
    expect(markup).toContain('Resume your draft?')
    expect(markup).toContain('Maple oat milk')
    expect(markup).toContain(' · saved 2 hours ago')
    expect(markup).toContain('>Resume<')
    expect(markup).not.toContain('Loading…')
    expect(markup).not.toContain('disabled')
    expectOrder(markup, [
      'Resume your draft?',
      'Maple oat milk',
      ' · saved 2 hours ago',
      'Start fresh',
      '>Resume<',
    ])
  })

  it('falls back to an untitled label and shows the loading resume action', () => {
    const blank = renderBanner({ title: '   ' })
    const missing = renderBanner({ title: null })
    const busy = renderBanner({ busy: true })

    expect(blank).toContain('Untitled study')
    expect(blank).not.toContain('Maple oat milk')
    expect(missing).toContain('Untitled study')
    expect(busy).toContain('>Loading…<')
    expect(busy).not.toContain('>Resume<')
    expect(busy.match(/disabled=""/g)).toHaveLength(2)
  })
})
