export type Step = 'login' | 'forgot'

export function parseUrlErrors(): { error: string | null; errorCode: string | null } {
  if (typeof window === 'undefined') return { error: null, errorCode: null }

  const searchParams = new URLSearchParams(window.location.search)
  const hashRaw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const hashParams = new URLSearchParams(hashRaw)

  const error = searchParams.get('error') ?? hashParams.get('error')
  const errorCode = searchParams.get('error_code') ?? hashParams.get('error_code')

  return { error, errorCode }
}
