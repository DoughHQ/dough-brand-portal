import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import RowOverflowMenu from '../../RowOverflowMenu'
import RowOverflowPanel from '../RowOverflowPanel'
import { placeMenu } from '../placeMenu'

function rect(top: number, bottom: number, right: number): DOMRect {
  return { top, bottom, right } as unknown as DOMRect
}

describe('placeMenu', () => {
  it('opens below the button when there is room', () => {
    vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 })

    expect(placeMenu(rect(100, 140, 200), 160, 80)).toEqual({ top: 144, left: 40 })
  })

  it('opens above the button when the space below is shorter', () => {
    vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 })

    expect(placeMenu(rect(700, 740, 200), 160, 80)).toEqual({ top: 616, left: 40 })
  })

  it('keeps the menu inside the viewport', () => {
    vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 100 })

    expect(placeMenu(rect(50, 60, 20), 160, 80)).toEqual({ top: 8, left: 8 })
  })
})

describe('RowOverflowMenu', () => {
  it('renders nothing without actions', () => {
    expect(renderToStaticMarkup(<RowOverflowMenu actions={[]} />)).toBe('')
  })

  it('starts as a closed more-actions button', () => {
    const markup = renderToStaticMarkup(
      <RowOverflowMenu actions={[{ label: 'Rename', onClick: () => undefined }]} />,
    )

    expect(markup).toContain('class="studies-kebab"')
    expect(markup).toContain('aria-label="More actions"')
    expect(markup).toContain('aria-haspopup="menu"')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('⋯')
    expect(markup).not.toContain('is-open')
    expect(markup).not.toContain('role="menu"')
    expect(markup).not.toContain('Rename')
  })

  it('uses a caller label', () => {
    const markup = renderToStaticMarkup(
      <RowOverflowMenu
        label="Draft actions"
        actions={[{ label: 'Rename', onClick: () => undefined }]}
      />,
    )

    expect(markup).toContain('aria-label="Draft actions"')
  })
})

describe('RowOverflowPanel', () => {
  it('lists actions in order and marks a danger item', () => {
    const markup = renderToStaticMarkup(
      <RowOverflowPanel
        actions={[
          { label: 'Rename', disabled: true, onClick: () => undefined },
          { label: 'Delete', tone: 'danger', onClick: () => undefined },
        ]}
        pos={{ top: 12, left: 24 }}
        menuRef={() => undefined}
        onClose={() => undefined}
      />,
    )

    const rename = markup.indexOf('>Rename<')
    const remove = markup.indexOf('>Delete<')
    expect(markup).toContain('role="menu"')
    expect(markup).toContain('role="menuitem"')
    expect(rename).toBeGreaterThanOrEqual(0)
    expect(remove).toBeGreaterThan(rename)
    expect(markup).toContain('disabled=""')
    expect(markup).toContain('visibility:visible')
  })
})
