// @vitest-environment jsdom

import { useState } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
  getSession: vi.fn(),
  insert: vi.fn(),
  rpc: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/components/auth/authShell.css', () => ({}))
vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))

import ApplyBrandFlow, { type ApplyStep } from '../../ApplyBrandFlow'

const styles = {
  cardStyle: { padding: 24 },
  inputStyle: { padding: 8 },
  labelStyle: { fontSize: 12 },
  primaryBtnStyle: (disabled: boolean) => ({ opacity: disabled ? 0.5 : 1 }),
}

function ApplyHarness() {
  const [step, setStep] = useState<ApplyStep>('search')
  const [error, setError] = useState<string | null>(null)

  return (
    <ApplyBrandFlow
      step={step}
      setStep={setStep}
      error={error}
      setError={setError}
      onGoToLogin={() => {}}
      styles={styles}
    />
  )
}

async function completeRequiredFields() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'I don’t see my brand →' }))
  await user.type(
    screen.getByPlaceholderText('Your brand as you’d like it listed'),
    'Acme Foods',
  )
  await user.type(screen.getByPlaceholderText('Jane Smith'), 'Jane Smith')
  await user.type(screen.getByPlaceholderText('jane@brand.com'), 'Jane@Brand.COM')
  await user.type(screen.getByPlaceholderText('yourbrand.com'), 'https://acme.example')
  return user
}

beforeEach(() => {
  mocks.getSession.mockReset()
  mocks.getSession.mockResolvedValue({ data: { session: null } })
  mocks.insert.mockReset()
  mocks.insert.mockResolvedValue({ error: null })
  mocks.rpc.mockReset()
  mocks.signOut.mockReset()
  mocks.from.mockReset()
  mocks.from.mockReturnValue({ insert: mocks.insert })
  mocks.createClient.mockReset()
  mocks.createClient.mockReturnValue({
    auth: {
      getSession: mocks.getSession,
      signOut: mocks.signOut,
    },
    from: mocks.from,
    rpc: mocks.rpc,
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ApplyBrandFlow behavior', () => {
  it('submits a net-new brand application and advances to confirmation', async () => {
    render(<ApplyHarness />)
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalledOnce())
    const user = await completeRequiredFields()

    await user.click(screen.getByRole('button', { name: 'Submit application' }))

    await waitFor(() =>
      expect(mocks.insert).toHaveBeenCalledWith({
        brand_name: 'Acme Foods',
        contact_name: 'Jane Smith',
        contact_email: 'jane@brand.com',
        brand_id: null,
        role_title: null,
        linkedin_url: null,
        brand_website: 'https://acme.example',
        flagged_not_mine_product_ids: [],
      }),
    )
    expect(await screen.findByText('Application received.')).toBeTruthy()
  })

  it('shows the generic failure message when the application insert fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.insert.mockResolvedValue({ error: { code: 'unexpected' } })
    render(<ApplyHarness />)
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalledOnce())
    const user = await completeRequiredFields()

    await user.click(screen.getByRole('button', { name: 'Submit application' }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy()
    expect(screen.queryByText('Application received.')).toBeNull()
    expect(consoleError).toHaveBeenCalledWith('brand_waitlist insert', {
      code: 'unexpected',
    })
  })
})
