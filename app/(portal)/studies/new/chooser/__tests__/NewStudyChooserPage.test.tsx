import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../studiesPage.css', () => ({}))

import NewStudyChooserPage from '../../page'

function renderChooser() {
  return renderToStaticMarkup(<NewStudyChooserPage />)
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('NewStudyChooserPage', () => {
  it('offers a concept test and an iHUT study from a resting card', () => {
    const markup = renderChooser()

    expect(markup).toContain('class="studies-shell"')
    expect(markup).toContain('href="/studies"')
    expect(markup).toContain('← Back to studies')
    expect(markup).toContain('New study')
    expect(markup).toContain('What kind of study do you want to run?')
    expect(markup).toContain('href="/studies/concept/new"')
    expect(markup).toContain('◇')
    expect(markup).toContain('Concept test')
    expect(markup).toContain(
      'Validate names, packaging, and claims before you ship a physical product.',
    )
    expect(markup).toContain('href="/studies/box/new"')
    expect(markup).toContain('▣')
    expect(markup).toContain('iHUT study')
    expect(markup).toContain(
      'Ship real products to qualified people and measure what they actually reach for.',
    )
    expect(markup).not.toContain('0 4px 16px rgba(36, 61, 44, 0.06)')
    expectOrder(markup, [
      '← Back to studies',
      'New study',
      'What kind of study do you want to run?',
      'href="/studies/concept/new"',
      '◇',
      'Concept test',
      'Continue →',
      'href="/studies/box/new"',
      '▣',
      'iHUT study',
      'Continue →',
    ])
  })
})
