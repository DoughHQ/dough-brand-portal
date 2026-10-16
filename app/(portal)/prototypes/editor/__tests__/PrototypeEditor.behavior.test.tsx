// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'

const mocks = vi.hoisted(() => ({
  archiveBrandPrototypeAction: vi.fn(),
  declarePrototypeAllergensAction: vi.fn(),
  getTaxonomyNodeAction: vi.fn(),
  saveBrandPrototypeAction: vi.fn(),
}))

vi.mock('@/app/(portal)/prototypes/actions', () => ({
  archiveBrandPrototypeAction: mocks.archiveBrandPrototypeAction,
  declarePrototypeAllergensAction: mocks.declarePrototypeAllergensAction,
  saveBrandPrototypeAction: mocks.saveBrandPrototypeAction,
}))
vi.mock('@/app/(portal)/studies/audienceActions', () => ({
  getTaxonomyNodeAction: mocks.getTaxonomyNodeAction,
}))
vi.mock('@/components/studies/audience/CategoryCombobox', () => ({
  default: ({
    selected,
    onSelect,
  }: {
    selected: TaxonomyNodeInfo | null
    onSelect: (node: TaxonomyNodeInfo) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          taxonomy_node_id: 9,
          node_name_display: 'Snacks',
          node_name_normalized: 'snacks',
          parent_taxonomy_node_id: 3,
          l1_node_name: 'Food',
          l2_node_name: 'Savory snacks',
          breadcrumb: 'Food › Savory snacks › Snacks',
        })
      }
    >
      {selected?.node_name_display ?? 'Choose Snacks'}
    </button>
  ),
}))
vi.mock('@/app/(portal)/prototypes/PrototypeImageUploader', () => ({
  default: () => <div>Photo uploader</div>,
}))

import PrototypeEditor from '../../PrototypeEditor'

const node: TaxonomyNodeInfo = {
  taxonomy_node_id: 9,
  node_name_display: 'Snacks',
  node_name_normalized: 'snacks',
  parent_taxonomy_node_id: 3,
  l1_node_name: 'Food',
  l2_node_name: 'Savory snacks',
  breadcrumb: 'Food › Savory snacks › Snacks',
}

const saved: PrototypeListItem = {
  id: 'prototype-1',
  brand_id: 7,
  name: 'Honey chips',
  internal_label: 'v2 formula',
  taxonomy_node_id: 9,
  packaging: 'plain_sample',
  planned_price: 4.99,
  image_paths: [],
  allergens_contains: [],
  allergens_may_contain: [],
  allergens_declared_at: null,
  allergens_declared_by: null,
  created_by: 'user-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  archived_at: null,
  archived_by: null,
  readiness: 'needs_allergens',
  category_label: 'Snacks',
}

function renderEditor(initial: PrototypeListItem | null = null) {
  const callbacks = {
    onArchived: vi.fn(),
    onClose: vi.fn(),
    onSaved: vi.fn(),
  }
  render(<PrototypeEditor brandId={7} initial={initial} {...callbacks} />)
  return callbacks
}

beforeEach(() => {
  mocks.getTaxonomyNodeAction.mockReset()
  mocks.getTaxonomyNodeAction.mockResolvedValue(node)
  mocks.saveBrandPrototypeAction.mockReset()
  mocks.saveBrandPrototypeAction.mockResolvedValue({ ok: true, data: saved })
  mocks.declarePrototypeAllergensAction.mockReset()
  mocks.declarePrototypeAllergensAction.mockResolvedValue({
    ok: true,
    data: {
      ...saved,
      allergens_contains: ['wheat'],
      allergens_declared_at: '2026-10-16T00:00:00.000Z',
      readiness: 'needs_photo',
    },
  })
  mocks.archiveBrandPrototypeAction.mockReset()
  mocks.archiveBrandPrototypeAction.mockResolvedValue({
    ok: true,
    data: { prototypeId: saved.id },
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PrototypeEditor behavior', () => {
  it('creates a categorized prototype and declares its allergens', async () => {
    const { onClose, onSaved } = renderEditor()
    const user = userEvent.setup()

    await user.type(
      screen.getByRole('textbox', { name: 'Name shown to respondents' }),
      'Honey chips',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Internal label · never shown' }),
      'v2 formula',
    )
    await user.click(screen.getByRole('button', { name: 'Choose Snacks' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Planned shelf price · optional' }),
      '4.99',
    )
    await user.click(screen.getAllByRole('button', { name: 'Wheat' })[0]!)
    await user.click(screen.getByRole('button', { name: 'Confirm allergens' }))
    await user.click(screen.getByRole('button', { name: 'Create prototype' }))

    expect(mocks.saveBrandPrototypeAction).toHaveBeenCalledWith({
      prototypeId: null,
      brandId: 7,
      name: 'Honey chips',
      internalLabel: 'v2 formula',
      taxonomyNodeId: 9,
      packaging: 'plain_sample',
      plannedPrice: 4.99,
      imagePaths: [],
    })
    await waitFor(() =>
      expect(mocks.declarePrototypeAllergensAction).toHaveBeenCalledWith({
        prototypeId: 'prototype-1',
        contains: ['wheat'],
        mayContain: [],
      }),
    )
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'prototype-1',
        allergens_contains: ['wheat'],
      }),
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('loads the existing category before editing', async () => {
    renderEditor(saved)

    expect(mocks.getTaxonomyNodeAction).toHaveBeenCalledWith(9)
    expect(await screen.findByRole('button', { name: 'Snacks' })).toBeTruthy()
  })

  it('archives an existing prototype after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { onArchived, onClose } = renderEditor(saved)
    const user = userEvent.setup()
    await screen.findByRole('button', { name: 'Snacks' })

    await user.click(screen.getByRole('button', { name: 'Archive' }))

    expect(window.confirm).toHaveBeenCalledWith(
      'Archive this prototype? It will leave the active library.',
    )
    expect(mocks.archiveBrandPrototypeAction).toHaveBeenCalledWith('prototype-1')
    await waitFor(() => expect(onArchived).toHaveBeenCalledWith('prototype-1'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows a save failure without closing the editor', async () => {
    mocks.saveBrandPrototypeAction.mockResolvedValue({
      ok: false,
      error: 'Could not save prototype.',
    })
    const { onClose, onSaved } = renderEditor()
    const user = userEvent.setup()

    await user.type(
      screen.getByRole('textbox', { name: 'Name shown to respondents' }),
      'Honey chips',
    )
    await user.click(screen.getByRole('button', { name: 'Choose Snacks' }))
    await user.click(screen.getByRole('button', { name: 'Create prototype' }))

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain(
      'Could not save prototype.',
    )
    expect(onSaved).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
