import { afterEach, describe, expect, it, vi } from 'vitest'
import { logHandledRpcFailure } from '../portal/logHandledRpcFailure'

describe('logHandledRpcFailure', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('emits one console.log JSON line and never console.error', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})

    logHandledRpcFailure('get_brand_adjacent_categories', {
      code: 'PGRST202',
      message: 'Could not find the function',
      details: 'Searched without parameters',
      hint: null,
      brandId: 20016372,
    })

    expect(err).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledTimes(1)
    const line = String(log.mock.calls[0]?.[0])
    expect(line.startsWith('[rpc:handled] get_brand_adjacent_categories ')).toBe(true)
    const json = JSON.parse(line.slice('[rpc:handled] get_brand_adjacent_categories '.length))
    expect(json).toEqual({
      code: 'PGRST202',
      message: 'Could not find the function',
      details: 'Searched without parameters',
      hint: null,
      brandId: 20016372,
    })
  })
})
