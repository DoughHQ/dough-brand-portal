// @vitest-environment jsdom

import { useCallback, useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  openServerStudyDraft: vi.fn(),
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))
vi.mock('@/lib/studies/openServerDraft', () => ({
  openServerStudyDraft: mocks.openServerStudyDraft,
}))

import {
  CommandPalette,
  type CommandItem,
  useCommandPaletteHotkey,
} from '../../CommandPalette'

const orderedItems: CommandItem[] = [
  { id: 'overview', label: 'Overview', href: '/dashboard', group: 'Overview' },
  { id: 'ops', label: 'Operations', href: '/ops', group: 'Ops' },
]

function HotkeyHarness() {
  const [open, setOpen] = useState(false)
  const onOpen = useCallback(() => setOpen(true), [])
  useCommandPaletteHotkey(onOpen)
  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      items={orderedItems}
    />
  )
}

beforeEach(() => {
  localStorage.clear()
  mocks.push.mockReset()
  mocks.openServerStudyDraft.mockReset()
})

afterEach(cleanup)

describe('CommandPalette behavior', () => {
  it('opens from the platform hotkey and closes from Escape or the backdrop', async () => {
    const user = userEvent.setup()
    render(<HotkeyHarness />)

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(await screen.findByRole('dialog', { name: 'Search portal' })).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Search portal' })).toBeNull(),
    )

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(await screen.findByRole('dialog', { name: 'Search portal' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Close search' }))
    expect(screen.queryByRole('dialog', { name: 'Search portal' })).toBeNull()
  })

  it('moves with arrow keys and opens the active command with Enter', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        items={orderedItems}
      />,
    )

    expect(
      screen.getByRole('option', { name: /Overview/ }).getAttribute('aria-selected'),
    ).toBe('true')
    await user.keyboard('{ArrowDown}')
    expect(
      screen.getByRole('option', { name: /Operations/ }).getAttribute(
        'aria-selected',
      ),
    ).toBe('true')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/ops'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders command groups in the product-defined order', () => {
    const items: CommandItem[] = [
      { id: 'ops', label: 'Ops tool', href: '/ops', group: 'Ops' },
      { id: 'product', label: 'Cola', href: '/products/1', group: 'Products' },
      { id: 'study', label: 'Cola study', href: '/studies/1', group: 'Studies' },
      { id: 'recent', label: 'Recent place', href: '/recent', group: 'Recent' },
    ]
    const { container } = render(
      <CommandPalette open onOpenChange={() => {}} items={items} />,
    )
    const text = container.textContent ?? ''

    expect(text.indexOf('Recent')).toBeLessThan(text.indexOf('Studies'))
    expect(text.indexOf('Studies')).toBeLessThan(text.indexOf('Products'))
    expect(text.indexOf('Products')).toBeLessThan(text.indexOf('Ops'))
  })
})
