// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BoxAudienceSection from '@/app/(portal)/studies/box/AudienceSection'
import ConceptAudienceSection from '@/app/(portal)/studies/concept/AudienceSection'
import { createEmptyBoxDraft } from '@/lib/box/defaults'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getTaxonomyNodeAction: vi.fn(),
  searchTaxonomyNodesAction: vi.fn(),
  rpcCountBoxQualifiers: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/app/(portal)/studies/audienceActions', () => ({
  getTaxonomyNodeAction: mocks.getTaxonomyNodeAction,
  searchTaxonomyNodesAction: mocks.searchTaxonomyNodesAction,
}))

vi.mock('@/lib/box/countQualifiers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/box/countQualifiers')>()
  return {
    ...actual,
    rpcCountBoxQualifiers: mocks.rpcCountBoxQualifiers,
  }
})

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()
  const query = {
    select: vi.fn(),
    order: vi.fn(),
    then: (
      resolve: (value: {
        data: {
          flag_code: string
          label: string
          category: string
          display_order: number
        }[]
        error: null
      }) => unknown,
    ) =>
      Promise.resolve({
        data: [
          {
            flag_code: 'gluten_free',
            label: 'Gluten free',
            category: 'diet',
            display_order: 1,
          },
        ],
        error: null,
      }).then(resolve),
  }
  query.select.mockReturnValue(query)
  query.order.mockReturnValue(query)
  mocks.createClient.mockReturnValue({
    from: vi.fn().mockReturnValue(query),
  })
  mocks.getTaxonomyNodeAction.mockResolvedValue(null)
  mocks.searchTaxonomyNodesAction.mockResolvedValue([])
  mocks.rpcCountBoxQualifiers.mockResolvedValue({
    qualifying_users: 12,
    below_viable_floor: false,
    warning: null,
  })
})

afterEach(cleanup)

describe('study audience sections', () => {
  it('preserves box narrowing and integer input behavior', async () => {
    const user = userEvent.setup()
    const draft = createEmptyBoxDraft(42)
    const onChange = vi.fn()
    render(
      <BoxAudienceSection
        draft={draft}
        onChange={onChange}
        sectionDone={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: '+ Narrow further' }))
    fireEvent.change(screen.getByPlaceholderText('Min'), {
      target: { value: '21' },
    })

    expect(onChange).toHaveBeenLastCalledWith({
      ...draft,
      eligibility: { ...draft.eligibility, minAge: 21 },
    })
  })

  it('keeps box narrowing open across section collapse', async () => {
    const user = userEvent.setup()
    render(
      <BoxAudienceSection
        draft={createEmptyBoxDraft(42)}
        onChange={vi.fn()}
        sectionDone={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: '+ Narrow further' }))
    expect(screen.getByText('Ship-to states')).toBeTruthy()
    await user.click(
      screen.getByRole('button', { name: '+ Add dietary match' }),
    )
    await user.click(
      screen.getByRole('button', { name: '+ Add a category requirement' }),
    )
    expect(screen.getByPlaceholderText('Search categories…')).toBeTruthy()

    const sectionToggle = document.querySelector<HTMLButtonElement>(
      '.cb-builder-section-toggle',
    )
    expect(sectionToggle).not.toBeNull()
    await user.click(sectionToggle!)
    expect(screen.queryByText('Ship-to states')).toBeNull()
    await user.click(sectionToggle!)

    expect(screen.getByText('Ship-to states')).toBeTruthy()
    expect(
      screen.getByText(/Claimant must match every selected flag/),
    ).toBeTruthy()
    expect(screen.getByPlaceholderText('Search categories…')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: '+ Narrow further' }),
    ).toBeNull()
  })

  it('keeps concept-only category tries out of box eligibility', async () => {
    const user = userEvent.setup()
    const box = render(
      <BoxAudienceSection
        draft={createEmptyBoxDraft(42)}
        onChange={vi.fn()}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: '+ Add a category requirement' }),
    )
    expect(screen.queryByText('Min tries')).toBeNull()
    box.unmount()

    render(
      <ConceptAudienceSection
        draft={createEmptyConceptDraft()}
        onChange={vi.fn()}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: '+ Add a category requirement' }),
    )
    expect(screen.getByText('Min tries')).toBeTruthy()
  })

  it('preserves concept dietary selection and audience copy', async () => {
    const user = userEvent.setup()
    const draft = createEmptyConceptDraft()
    const onChange = vi.fn()
    render(<ConceptAudienceSection draft={draft} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '+ Narrow further' }))
    await user.click(
      screen.getByRole('button', { name: '+ Add dietary match' }),
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Gluten free' })).toBeTruthy(),
    )
    await user.click(screen.getByRole('button', { name: 'Gluten free' }))

    expect(
      screen.getByText(/Respondent must match every selected flag/),
    ).toBeTruthy()
    expect(onChange).toHaveBeenLastCalledWith({
      ...draft,
      eligibility: {
        ...draft.eligibility,
        requiredDietaryFlags: ['gluten_free'],
      },
    })
  })

  it('keeps the box tried-loop explanation keyboard dismissible', async () => {
    const user = userEvent.setup()
    render(
      <BoxAudienceSection
        draft={createEmptyBoxDraft(42)}
        onChange={vi.fn()}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'What counts as tried?' }),
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
