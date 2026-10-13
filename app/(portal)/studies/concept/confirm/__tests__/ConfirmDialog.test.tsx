import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ConfirmDialog from '../../ConfirmDialog'

function renderConfirm(
  overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(ConfirmDialog, {
      request: null,
      onCancel: () => {},
      ...overrides,
    }),
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

describe('ConfirmDialog', () => {
  it('renders nothing when no confirmation is pending', () => {
    expect(renderConfirm()).toBe('')
  })

  it('asks before a destructive draft change and weights the action label', () => {
    const markup = renderConfirm({
      request: {
        title: 'Remove this design?',
        body: 'The variants on this design will be removed.',
        confirmLabel: 'Remove design',
        onConfirm: () => {},
      },
    })

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('class="cb-confirm-overlay"')
    expect(markup).toContain('class="cb-confirm-panel"')
    expect(markup).toContain('data-cancel="true"')
    expect(markup).not.toContain('cb-btn-danger')
    expectOrder(markup, [
      'id="cb-confirm-title"',
      'Remove this design?',
      'id="cb-confirm-body"',
      'The variants on this design will be removed.',
      'class="cb-confirm-actions"',
      'class="cb-btn-outline"',
      'Cancel',
      'class="cb-btn cb-btn-primary"',
      'Remove design',
    ])
  })
})
