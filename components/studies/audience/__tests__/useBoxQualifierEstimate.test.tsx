// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyBoxDraft } from '@/lib/box/defaults'
import type { CountBoxQualifiersResult } from '@/lib/box/countQualifiers'
import { useBoxQualifierEstimate } from '../useBoxQualifierEstimate'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpcCountBoxQualifiers: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/box/countQualifiers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/box/countQualifiers')>()
  return {
    ...actual,
    rpcCountBoxQualifiers: mocks.rpcCountBoxQualifiers,
  }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function qualifierResult(
  qualifyingUsers: number,
): CountBoxQualifiersResult {
  return {
    qualifying_users: qualifyingUsers,
    total_users: 100,
    pass_experience: 80,
    pass_rules: qualifyingUsers,
    below_viable_floor: false,
    warning: null,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  mocks.createClient.mockReset()
  mocks.rpcCountBoxQualifiers.mockReset()
  mocks.createClient.mockReturnValue({ client: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useBoxQualifierEstimate', () => {
  it('debounces requests and ignores an older in-flight result', async () => {
    const first = deferred<CountBoxQualifiersResult>()
    const second = deferred<CountBoxQualifiersResult>()
    mocks.rpcCountBoxQualifiers
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const draft = {
      ...createEmptyBoxDraft(42),
      focalProductId: 7,
    }
    const rendered = renderHook(
      ({ minAge }) =>
        useBoxQualifierEstimate({
          ...draft,
          eligibility: { ...draft.eligibility, minAge },
        }),
      { initialProps: { minAge: null as number | null } },
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(349)
    })
    expect(mocks.rpcCountBoxQualifiers).not.toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(mocks.rpcCountBoxQualifiers).toHaveBeenCalledTimes(1)

    rendered.rerender({ minAge: 21 })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
    })
    expect(mocks.rpcCountBoxQualifiers).toHaveBeenCalledTimes(2)

    await act(async () => {
      second.resolve(qualifierResult(24))
      await second.promise
    })
    expect(rendered.result.current.headline).toBe('~24 people qualify')

    await act(async () => {
      first.resolve(qualifierResult(99))
      await first.promise
    })
    expect(rendered.result.current.headline).toBe('~24 people qualify')
  })

  it('does not retain an estimate after the current request fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.rpcCountBoxQualifiers
      .mockResolvedValueOnce(qualifierResult(42))
      .mockRejectedValueOnce(new Error('network unavailable'))
    const draft = {
      ...createEmptyBoxDraft(42),
      focalProductId: 7,
    }
    const rendered = renderHook(
      ({ minAge }) =>
        useBoxQualifierEstimate({
          ...draft,
          eligibility: { ...draft.eligibility, minAge },
        }),
      { initialProps: { minAge: null as number | null } },
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
    })
    expect(rendered.result.current.headline).toBe('~42 people qualify')

    rendered.rerender({ minAge: 21 })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
    })
    expect(rendered.result.current.count).toBeNull()
    expect(rendered.result.current.headline).toBe('—')
    consoleError.mockRestore()
  })
})
