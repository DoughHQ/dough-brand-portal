import { beforeEach, describe, expect, it, vi } from 'vitest'

const createServerSupabaseClient = vi.fn()
const revalidatePath = vi.fn()
const logHandledRpcFailure = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: (...args: unknown[]) => createServerSupabaseClient(...args),
}))

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}))

vi.mock('@/lib/portal/logHandledRpcFailure', () => ({
  logHandledRpcFailure: (...args: unknown[]) => logHandledRpcFailure(...args),
}))

const actionsPath = '../../app/(portal)/dashboard/onboardingActions'

describe('completeBrandOnboardingAction', () => {
  beforeEach(() => {
    vi.resetModules()
    createServerSupabaseClient.mockReset()
    revalidatePath.mockReset()
    logHandledRpcFailure.mockReset()
  })

  it('returns ok:false with no raw text when rpc fails', async () => {
    createServerSupabaseClient.mockResolvedValue({
      rpc: async () => ({
        data: null,
        error: { code: '42501', message: 'permission denied for function', details: null, hint: null },
      }),
    })

    const { completeBrandOnboardingAction } = await import(actionsPath)
    const res = await completeBrandOnboardingAction()
    expect(res).toEqual({ ok: false })
    expect(JSON.stringify(res)).not.toMatch(/permission denied/i)
    expect(revalidatePath).not.toHaveBeenCalled()
    expect(logHandledRpcFailure).toHaveBeenCalled()
  })

  it('revalidates dashboard on success', async () => {
    createServerSupabaseClient.mockResolvedValue({
      rpc: async () => ({ data: { ok: true }, error: null }),
    })

    const { completeBrandOnboardingAction } = await import(actionsPath)
    const res = await completeBrandOnboardingAction()
    expect(res).toEqual({ ok: true })
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})
