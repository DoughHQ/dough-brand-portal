// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompareGroupDetail } from '@/lib/compareGroups.shared'

const mocks = vi.hoisted(() => ({
  checkSimilarityAction: vi.fn(),
  refresh: vi.fn(),
  updateFieldsAction: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))
vi.mock('@/app/(portal)/admin/compare-groups/actions', () => ({
  checkSimilarityAction: mocks.checkSimilarityAction,
  updateFieldsAction: mocks.updateFieldsAction,
}))
vi.mock('@/app/(portal)/admin/compare-groups/_components/SimilarityWarnings', () => ({
  default: ({ loading }: { loading: boolean }) => (
    <div>{loading ? 'Checking similarity…' : 'Similarity checked'}</div>
  ),
}))

import EditDetailsPanel from '../../EditDetailsPanel'

const detail: CompareGroupDetail = {
  group: {
    compare_group_id: 1,
    name: 'Cola',
    consumer_question: 'Which cola?',
    description: 'Sweet colas',
    type: 'benchmark',
    battle_level: 2,
    status: 'deprecated',
  },
  nodes: [
    {
      taxonomy_node_id: 4,
      node_name: 'Cola',
      node_level: 3,
      path_names: 'Drinks > Soda > Cola',
      l2_node_name: 'Soda',
      priority: 1,
      membership_id: 10,
    },
  ],
  recent_revisions: [],
}

function renderPanel(onClose = vi.fn(), onError = vi.fn()) {
  render(
    <EditDetailsPanel
      id={1}
      detail={detail}
      onClose={onClose}
      onError={onError}
    />,
  )
  return { onClose, onError }
}

beforeEach(() => {
  mocks.checkSimilarityAction.mockReset()
  mocks.checkSimilarityAction.mockResolvedValue({ ok: true, data: null })
  mocks.updateFieldsAction.mockReset()
  mocks.updateFieldsAction.mockResolvedValue({ ok: true, data: detail })
  mocks.refresh.mockReset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('EditDetailsPanel behavior', () => {
  it('debounces similarity checks and cancels the stale question timer', async () => {
    vi.useFakeTimers()
    renderPanel()
    const question = screen.getByRole('textbox', { name: 'Consumer question' })

    fireEvent.change(question, { target: { value: 'Which soda?' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(399)
    })
    expect(mocks.checkSimilarityAction).not.toHaveBeenCalled()

    fireEvent.change(question, { target: { value: 'Which soda? today' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(399)
    })
    expect(mocks.checkSimilarityAction).not.toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(mocks.checkSimilarityAction).toHaveBeenCalledOnce()
    expect(mocks.checkSimilarityAction).toHaveBeenCalledWith(
      [4],
      'Which soda? today',
      1,
    )
  })

  it('sends only changed fields, then refreshes and closes', async () => {
    const user = userEvent.setup()
    const { onClose, onError } = renderPanel()

    await user.clear(screen.getByRole('textbox', { name: 'Name' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Cola Zero')
    await user.clear(screen.getByRole('textbox', { name: 'Description' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'active')
    await user.type(
      screen.getByRole('textbox', { name: 'Reason (optional audit note)' }),
      'Cleanup',
    )
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mocks.updateFieldsAction).toHaveBeenCalledWith(1, {
      name: 'Cola Zero',
      description: null,
      status: 'active',
      note: 'Cleanup',
    })
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce())
    expect(onClose).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(null)
  })

  it('closes without saving when nothing changed', async () => {
    const user = userEvent.setup()
    const { onClose } = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mocks.updateFieldsAction).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('reports required-name and battle-level validation failures', () => {
    const { onError } = renderPanel()
    const form = screen.getByRole('button', { name: 'Save changes' }).closest('form')
    if (!form) throw new Error('Edit form was not rendered')

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: '' },
    })
    fireEvent.submit(form)
    expect(onError).toHaveBeenLastCalledWith('Name is required.')

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Cola' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Battle level' }), {
      target: { value: '0' },
    })
    fireEvent.submit(form)
    expect(onError).toHaveBeenLastCalledWith(
      'Battle level must be a positive integer.',
    )
    expect(mocks.updateFieldsAction).not.toHaveBeenCalled()
  })
})
