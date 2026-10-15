// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GENERIC_INVITE_ERROR_COPY } from '@/lib/brandInviteCopy'

const continueInviteAction = vi.fn()
const connectInviteAction = vi.fn()
const refresh = vi.fn()
const rethrow = vi.fn((e: unknown) => {
  // Mimic Next: only swallow redirect errors; leave others to the catch body.
  if (e && typeof e === 'object' && 'digest' in e) throw e
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
  unstable_rethrow: (e: unknown) => rethrow(e),
}))

vi.mock('../actions', () => ({
  continueInviteAction: (...args: unknown[]) => continueInviteAction(...args),
  connectInviteAction: (...args: unknown[]) => connectInviteAction(...args),
}))

import { ContinueInvite } from '../InviteActions'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  continueInviteAction.mockReset()
  connectInviteAction.mockReset()
  refresh.mockReset()
  rethrow.mockClear()
})

describe('InviteActions throw path', () => {
  it('shows the generic invite copy when continueInviteAction throws a non-redirect error', async () => {
    continueInviteAction.mockRejectedValue(new Error('boom'))
    const user = userEvent.setup()
    render(<ContinueInvite token={'B'.repeat(43)} label="Continue" />)

    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText(GENERIC_INVITE_ERROR_COPY)).toBeTruthy()
    expect(rethrow).toHaveBeenCalled()
  })
})
