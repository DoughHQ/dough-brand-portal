// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  enterAsBrand: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ rpc: mocks.rpc }),
}))
vi.mock('@/lib/portal/useEnterImpersonation', () => ({
  useEnterImpersonation: () => ({
    enterAsBrand: mocks.enterAsBrand,
    loading: false,
  }),
}))

import ImpersonateBrandClient from '../../ImpersonateBrandClient'

async function finishDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(180)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  mocks.rpc.mockReset()
  mocks.enterAsBrand.mockReset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('ImpersonateBrandClient behavior', () => {
  it('cancels a pending search when the user keeps typing', async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          brand_id: 3,
          brand_name: 'Beta Foods',
          product_count: 12,
          battle_count: 340,
          top_elo: 1512.6,
        },
      ],
      error: null,
    })
    render(<ImpersonateBrandClient currentImpersonatedBrandId={null} />)
    const input = screen.getByRole('searchbox', {
      name: 'Search brands to impersonate',
    })

    fireEvent.change(input, { target: { value: 'be' } })
    act(() => vi.advanceTimersByTime(100))
    fireEvent.change(input, { target: { value: 'beta' } })
    act(() => vi.advanceTimersByTime(179))
    expect(mocks.rpc).not.toHaveBeenCalled()

    await finishDebounce()

    expect(mocks.rpc).toHaveBeenCalledTimes(1)
    expect(mocks.rpc).toHaveBeenCalledWith('search_brands_admin', {
      p_query: 'beta',
    })
    expect(screen.getByText('Beta Foods')).toBeTruthy()
    expect(screen.getByText(/12 products · 340 battles · top Elo 1513/)).toBeTruthy()
  })

  it('shows the RPC error returned by the search', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Brand search is unavailable.' },
    })
    render(<ImpersonateBrandClient currentImpersonatedBrandId={null} />)

    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Search brands to impersonate',
      }),
      { target: { value: 'acme' } },
    )
    await finishDebounce()

    expect(screen.getByText('Brand search is unavailable.')).toBeTruthy()
    expect(screen.getByText('No brands match “acme”.')).toBeTruthy()
  })

  it('enters a selected brand and surfaces a failed attempt', async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          brand_id: 3,
          brand_name: 'Acme',
          product_count: 4,
          battle_count: 10,
          top_elo: null,
        },
      ],
      error: null,
    })
    mocks.enterAsBrand
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, error: 'Could not enter Acme.' })
    render(<ImpersonateBrandClient currentImpersonatedBrandId={null} />)

    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Search brands to impersonate',
      }),
      { target: { value: 'acme' } },
    )
    await finishDebounce()
    const result = screen.getByRole('button', { name: /Acme/ })

    await act(async () => {
      fireEvent.click(result)
      await Promise.resolve()
    })
    expect(mocks.enterAsBrand).toHaveBeenNthCalledWith(1, 3, '/dashboard')
    expect(screen.queryByText('Could not enter Acme.')).toBeNull()

    await act(async () => {
      fireEvent.click(result)
      await Promise.resolve()
    })
    expect(mocks.enterAsBrand).toHaveBeenNthCalledWith(2, 3, '/dashboard')
    expect(screen.getByText('Could not enter Acme.')).toBeTruthy()
  })
})
