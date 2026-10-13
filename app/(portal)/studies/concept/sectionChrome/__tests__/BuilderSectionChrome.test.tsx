import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import BuilderSectionChrome from '../../BuilderSectionChrome'

function renderChrome(
  overrides: Partial<Parameters<typeof BuilderSectionChrome>[0]> = {},
) {
  return renderToStaticMarkup(
    <BuilderSectionChrome
      id="box-setup"
      title="Setup"
      summary="Name the study"
      done={false}
      {...overrides}
    >
      How it runs
    </BuilderSectionChrome>,
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

describe('BuilderSectionChrome', () => {
  it('opens an unfinished section and shows its body', () => {
    const markup = renderChrome({ className: 'is-setup' })

    expect(markup).toContain('id="box-setup"')
    expect(markup).toContain('class="cb-builder-section is-setup"')
    expect(markup).toContain('data-done="false"')
    expect(markup).toContain('data-open="true"')
    expect(markup).toContain('aria-expanded="true"')
    expect(markup).toContain('aria-controls="box-setup-body"')
    expect(markup).toContain('id="box-setup-body"')
    expect(markup).toContain('M5 12.5 10 7.5 15 12.5')
    expectOrder(markup, [
      'Setup',
      'Name the study',
      'id="box-setup-body"',
      'How it runs',
    ])
  })

  it('collapses a finished section and hides the body', () => {
    const markup = renderChrome({ done: true, summary: 'Ready' })

    expect(markup).toContain('data-done="true"')
    expect(markup).toContain('data-open="false"')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('M5 7.5 10 12.5 15 7.5')
    expect(markup).toContain('Ready')
    expect(markup).not.toContain('id="box-setup-body"')
    expect(markup).not.toContain('How it runs')
  })
})
