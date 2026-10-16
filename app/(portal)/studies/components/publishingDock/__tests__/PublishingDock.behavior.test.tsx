// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PublishingDock, { type PublishingDockNeed } from '../../PublishingDock'

const needs: PublishingDockNeed[] = [
  { message: 'Add a product', anchor: 'product' },
  { message: 'Name the study', anchor: 'name' },
]

function renderDock(onScrollTo = vi.fn()) {
  const view = render(
    <PublishingDock
      ready={false}
      needs={needs}
      saveStatus="idle"
      saving={false}
      publishing={false}
      actionsLocked={false}
      publishMuted={false}
      publishLabel="Publish"
      onSave={() => {}}
      onPublish={() => {}}
      onScrollTo={onScrollTo}
      stickyRef={() => {}}
    />,
  )
  return { ...view, onScrollTo }
}

afterEach(cleanup)

describe('PublishingDock behavior', () => {
  it('opens the full blocker list and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderDock()

    await user.click(screen.getByRole('button', { name: /2 left/ }))
    expect(screen.getByRole('listbox', { name: 'Still needed' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Add a product' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Name the study' })).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox', { name: 'Still needed' })).toBeNull()
  })

  it('closes the blocker list after an outside click', async () => {
    const user = userEvent.setup()
    renderDock()

    await user.click(screen.getByRole('button', { name: /2 left/ }))
    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('listbox', { name: 'Still needed' })).toBeNull()
  })

  it('scrolls to the selected blocker and closes the list', async () => {
    const user = userEvent.setup()
    const { onScrollTo } = renderDock()

    await user.click(screen.getByRole('button', { name: /2 left/ }))
    await user.click(screen.getByRole('option', { name: 'Name the study' }))

    expect(onScrollTo).toHaveBeenCalledWith('name')
    expect(screen.queryByRole('listbox', { name: 'Still needed' })).toBeNull()
  })
})
