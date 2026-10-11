// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BarInput, InfoButton } from '../AudienceControls'
import { useAudienceReferenceData } from '../useAudienceReferenceData'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getTaxonomyNodeAction: vi.fn(),
  searchTaxonomyNodesAction: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/app/(portal)/studies/audienceActions', () => ({
  getTaxonomyNodeAction: mocks.getTaxonomyNodeAction,
  searchTaxonomyNodesAction: mocks.searchTaxonomyNodesAction,
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function ReferenceHarness({ nodeId }: { nodeId: number | null }) {
  const data = useAudienceReferenceData(nodeId, 'concept')
  return (
    <div>
      <span>{data.qualifyingNode?.node_name_display ?? 'none'}</span>
      <span>{data.dietaryStatus}</span>
    </div>
  )
}

describe('shared audience controls', () => {
  it('parses bar input and dismisses info on an outside interaction', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <>
        <InfoButton title="Battle" body="Battle body" ariaLabel="Battle info" />
        <BarInput
          label="Minimum"
          hint="Hint"
          value={null}
          onChange={onChange}
        />
        <button type="button">Outside</button>
      </>,
    )

    fireEvent.change(screen.getByPlaceholderText('—'), {
      target: { value: '8' },
    })
    expect(screen.getByLabelText('Minimum')).toBeTruthy()
    expect(onChange).toHaveBeenLastCalledWith(8)
    fireEvent.change(screen.getByPlaceholderText('—'), {
      target: { value: '8.5' },
    })
    expect(onChange).toHaveBeenLastCalledWith(null)

    await user.click(screen.getByRole('button', { name: 'Battle info' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('ignores a stale taxonomy response after the node changes', async () => {
    const first = deferred<{
      taxonomy_node_id: number
      node_name_display: string
    } | null>()
    const second = deferred<{
      taxonomy_node_id: number
      node_name_display: string
    } | null>()
    mocks.getTaxonomyNodeAction
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const query = {
      select: vi.fn(),
      order: vi.fn(),
      then: (
        resolve: (value: { data: never[]; error: null }) => unknown,
      ) => Promise.resolve({ data: [], error: null }).then(resolve),
    }
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    mocks.createClient.mockReturnValue({
      from: vi.fn().mockReturnValue(query),
    })

    const view = render(<ReferenceHarness nodeId={1} />)
    view.rerender(<ReferenceHarness nodeId={2} />)

    second.resolve({
      taxonomy_node_id: 2,
      node_name_display: 'New category',
    })
    await screen.findByText('New category')

    first.resolve({
      taxonomy_node_id: 1,
      node_name_display: 'Stale category',
    })
    await waitFor(() => {
      expect(screen.queryByText('Stale category')).toBeNull()
      expect(screen.getByText('New category')).toBeTruthy()
    })
  })

  it('clears a resolved taxonomy node while its replacement loads', async () => {
    mocks.getTaxonomyNodeAction.mockReset()
    mocks.getTaxonomyNodeAction
      .mockResolvedValueOnce({
        taxonomy_node_id: 1,
        node_name_display: 'Old category',
      })
      .mockReturnValueOnce(new Promise(() => {}))

    const query = {
      select: vi.fn(),
      order: vi.fn(),
      then: (
        resolve: (value: { data: never[]; error: null }) => unknown,
      ) => Promise.resolve({ data: [], error: null }).then(resolve),
    }
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    mocks.createClient.mockReturnValue({
      from: vi.fn().mockReturnValue(query),
    })

    const view = render(<ReferenceHarness nodeId={1} />)
    await screen.findByText('Old category')
    view.rerender(<ReferenceHarness nodeId={2} />)
    expect(screen.getByText('none')).toBeTruthy()
    expect(screen.queryByText('Old category')).toBeNull()
  })
})
