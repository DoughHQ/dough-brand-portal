// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PrototypeListItem } from '@/lib/prototypes/types'

const mocks = vi.hoisted(() => ({
  savedItem: null as PrototypeListItem | null,
}))

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ storage: { from: vi.fn() } }),
}))
vi.mock('../../PrototypeEditor', () => ({
  default: ({
    initial,
    onClose,
    onSaved,
    onArchived,
  }: {
    initial: PrototypeListItem | null
    onClose: () => void
    onSaved: (item: PrototypeListItem) => void
    onArchived: (id: string) => void
  }) => (
    <div role="dialog" aria-label="Prototype editor">
      <span>{initial?.name ?? 'New prototype'}</span>
      <button type="button" onClick={onClose}>
        Close editor
      </button>
      <button
        type="button"
        disabled={!mocks.savedItem}
        onClick={() => {
          if (mocks.savedItem) onSaved(mocks.savedItem)
        }}
      >
        Save mock
      </button>
      {initial ? (
        <button type="button" onClick={() => onArchived(initial.id)}>
          Archive mock
        </button>
      ) : null}
    </div>
  ),
}))
vi.mock('../../prototypesPage.css', () => ({}))
vi.mock('@/components/categories/categoriesPage.css', () => ({}))

import PrototypesClient from '../../PrototypesClient'

function item(
  id: string,
  partial: Partial<PrototypeListItem> = {},
): PrototypeListItem {
  return {
    id,
    brand_id: 3,
    name: `Prototype ${id}`,
    internal_label: null,
    taxonomy_node_id: 7,
    packaging: 'plain_sample',
    planned_price: null,
    image_paths: [],
    allergens_contains: null,
    allergens_may_contain: null,
    allergens_declared_at: null,
    allergens_declared_by: null,
    created_by: null,
    created_at: '2026-10-01T12:00:00.000Z',
    updated_at: '2026-10-01T12:00:00.000Z',
    archived_at: null,
    archived_by: null,
    readiness: 'incomplete',
    category_label: 'Snacks',
    ...partial,
  }
}

beforeEach(() => {
  mocks.savedItem = null
})

afterEach(cleanup)

describe('PrototypesClient behavior', () => {
  it('filters prototypes by readiness and restores the full library', async () => {
    const user = userEvent.setup()
    render(
      <PrototypesClient
        brandId={3}
        brandName="Acme"
        initialItems={[
          item('ready', {
            name: 'Ready oat bar',
            readiness: 'ready',
            allergens_declared_at: '2026-10-01T12:00:00.000Z',
            image_paths: ['ready.png'],
          }),
          item('allergens', {
            name: 'Needs allergen review',
            readiness: 'needs_allergens',
          }),
        ]}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Needs allergens' }),
    )
    expect(screen.queryByText('Ready oat bar')).toBeNull()
    expect(screen.getByText('Needs allergen review')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Ready oat bar')).toBeTruthy()
    expect(screen.getByText('Needs allergen review')).toBeTruthy()
  })

  it('opens new and existing prototypes and closes the editor', async () => {
    const user = userEvent.setup()
    render(
      <PrototypesClient
        brandId={3}
        brandName="Acme"
        initialItems={[item('oat', { name: 'Oat bar v2' })]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add prototype' }))
    let editor = screen.getByRole('dialog', { name: 'Prototype editor' })
    expect(within(editor).getByText('New prototype')).toBeTruthy()
    await user.click(within(editor).getByRole('button', { name: 'Close editor' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: /Oat bar v2/ }))
    editor = screen.getByRole('dialog', { name: 'Prototype editor' })
    expect(within(editor).getByText('Oat bar v2')).toBeTruthy()
  })

  it('upserts saved prototypes and removes archived ones', async () => {
    const user = userEvent.setup()
    const original = item('oat', { name: 'Oat bar v2' })
    mocks.savedItem = item('new', {
      name: 'Cocoa bar',
      readiness: 'needs_photo',
    })
    render(
      <PrototypesClient
        brandId={3}
        brandName="Acme"
        initialItems={[original]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add prototype' }))
    await user.click(screen.getByRole('button', { name: 'Save mock' }))
    expect(screen.getByText('Cocoa bar')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Close editor' }))
    await user.click(screen.getByRole('button', { name: /Oat bar v2/ }))
    await user.click(screen.getByRole('button', { name: 'Archive mock' }))
    expect(
      screen.queryByRole('button', { name: /Oat bar v2/ }),
    ).toBeNull()
    expect(screen.getByText('Cocoa bar')).toBeTruthy()
  })
})
