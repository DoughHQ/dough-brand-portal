// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RowOverflowMenu from '../../RowOverflowMenu'

afterEach(cleanup)

describe('RowOverflowMenu behavior', () => {
  it('opens in a portal, invokes an action, and closes', async () => {
    const rename = vi.fn()
    const user = userEvent.setup()
    render(
      <RowOverflowMenu
        actions={[
          { label: 'Rename', onClick: rename },
          { label: 'Delete', tone: 'danger', onClick: vi.fn() },
        ]}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'More actions' })

    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('menu')).toBeTruthy()
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))

    expect(rename).toHaveBeenCalledOnce()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes from Escape and an outside pointer without invoking an action', async () => {
    const rename = vi.fn()
    const user = userEvent.setup()
    render(
      <RowOverflowMenu
        actions={[{ label: 'Rename', onClick: rename }]}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'More actions' })

    await user.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()

    await user.click(trigger)
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).toBeNull()
    expect(rename).not.toHaveBeenCalled()
  })
})
