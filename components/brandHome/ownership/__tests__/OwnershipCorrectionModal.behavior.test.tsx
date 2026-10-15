// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class OwnershipCorrectionError extends Error {}
  return {
    fetchActiveConglomerates: vi.fn(),
    OwnershipCorrectionError,
    submitBrandOwnershipCorrection: vi.fn(),
  }
})

vi.mock('@/lib/brandHome/brandOwnershipPortal', () => ({
  fetchActiveConglomerates: mocks.fetchActiveConglomerates,
  OwnershipCorrectionError: mocks.OwnershipCorrectionError,
  submitBrandOwnershipCorrection: mocks.submitBrandOwnershipCorrection,
}))

import OwnershipCorrectionModal from '../../OwnershipCorrectionModal'

const options = [
  { conglomerate_id: 1, display_name: 'Alpha Foods' },
  { conglomerate_id: 2, display_name: 'Beta Co' },
]

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function renderModal(onClose = vi.fn(), onSubmitted = vi.fn()) {
  render(
    <OwnershipCorrectionModal
      open
      onClose={onClose}
      onSubmitted={onSubmitted}
      currentParentName="Current Parent"
    />,
  )
  return { onClose, onSubmitted }
}

beforeEach(() => {
  mocks.fetchActiveConglomerates.mockReset()
  mocks.fetchActiveConglomerates.mockResolvedValue(options)
  mocks.submitBrandOwnershipCorrection.mockReset()
  mocks.submitBrandOwnershipCorrection.mockResolvedValue({})
})

afterEach(cleanup)

describe('OwnershipCorrectionModal behavior', () => {
  it('searches for a parent and submits evidence and notes', async () => {
    const request = deferred<unknown>()
    mocks.submitBrandOwnershipCorrection.mockReturnValueOnce(request.promise)
    const { onClose, onSubmitted } = renderModal()
    const user = userEvent.setup()

    const search = await screen.findByPlaceholderText('Search companies…')
    await user.type(search, 'alp')
    await user.click(screen.getByRole('button', { name: 'Alpha Foods' }))
    await user.type(
      screen.getByPlaceholderText('Anything that helps us verify this…'),
      'The acquisition closed this year.',
    )
    await user.type(
      screen.getByPlaceholderText('https://…'),
      'https://example.com/evidence',
    )
    await user.click(screen.getByRole('button', { name: 'Submit correction' }))

    expect(mocks.submitBrandOwnershipCorrection).toHaveBeenCalledWith({
      assertionType: 'has_parent',
      assertedConglomerateId: 1,
      userNotes: 'The acquisition closed this year.',
      evidenceUrl: 'https://example.com/evidence',
    })
    expect(
      (screen.getByRole('button', { name: 'Submitting…' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled,
    ).toBe(true)

    await act(async () => {
      request.resolve({})
      await request.promise
    })
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce())
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('submits an independent-brand assertion without a parent id', async () => {
    const { onClose, onSubmitted } = renderModal()
    const user = userEvent.setup()
    await screen.findByPlaceholderText('Search companies…')

    await user.click(
      screen.getByRole('radio', {
        name: 'This brand is independent (no parent company)',
      }),
    )
    await user.type(
      screen.getByPlaceholderText('Anything that helps us verify this…'),
      'Founder owned',
    )
    await user.click(screen.getByRole('button', { name: 'Submit correction' }))

    expect(mocks.submitBrandOwnershipCorrection).toHaveBeenCalledWith({
      assertionType: 'independent',
      assertedConglomerateId: null,
      userNotes: 'Founder owned',
      evidenceUrl: null,
    })
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce())
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('requires a selected parent before submitting', async () => {
    renderModal()
    const user = userEvent.setup()
    await screen.findByPlaceholderText('Search companies…')

    await user.click(screen.getByRole('button', { name: 'Submit correction' }))

    expect(
      await screen.findByText('Pick a parent company from the list.'),
    ).toBeTruthy()
    expect(mocks.submitBrandOwnershipCorrection).not.toHaveBeenCalled()
  })

  it('shows a domain submission error without closing the modal', async () => {
    mocks.submitBrandOwnershipCorrection.mockRejectedValue(
      new mocks.OwnershipCorrectionError('That’s already the recorded parent.'),
    )
    const { onClose, onSubmitted } = renderModal()
    const user = userEvent.setup()

    const search = await screen.findByPlaceholderText('Search companies…')
    await user.type(search, 'beta')
    await user.click(screen.getByRole('button', { name: 'Beta Co' }))
    await user.click(screen.getByRole('button', { name: 'Submit correction' }))

    expect(
      await screen.findByText('That’s already the recorded parent.'),
    ).toBeTruthy()
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
