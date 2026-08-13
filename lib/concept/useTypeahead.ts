'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type TypeaheadStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

/**
 * Debounced typeahead state machine. Race-safe via a monotonic request id
 * (works for client RPCs and Next server actions — AbortSignal alone cannot
 * cancel a server action). Fetchers may still honor `signal` when supported.
 */
export function useTypeahead<T>(
  fetcher: (query: string, signal: AbortSignal) => Promise<T[]>,
  opts: {
    minChars?: number
    debounceMs?: number
    /** When false, clears and stays idle (e.g. product already selected). */
    enabled?: boolean
  } = {}
) {
  const { minChars = 2, debounceMs = 220, enabled = true } = opts
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [status, setStatus] = useState<TypeaheadStatus>('idle')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const seqRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback(
    (q: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const seq = ++seqRef.current
      setStatus('loading')
      setOpen(true)
      fetcherRef
        .current(q, controller.signal)
        .then((rows) => {
          if (seq !== seqRef.current || controller.signal.aborted) return
          setResults(rows)
          setStatus(rows.length === 0 ? 'empty' : 'success')
          setActiveIndex(rows.length > 0 ? 0 : -1)
        })
        .catch((err) => {
          if (seq !== seqRef.current || controller.signal.aborted) return
          console.error('[typeahead] search failed', err)
          setStatus('error')
          setResults([])
          setActiveIndex(-1)
        })
    },
    []
  )

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!enabled) {
      abortRef.current?.abort()
      seqRef.current += 1
      setResults([])
      setStatus('idle')
      setActiveIndex(-1)
      setOpen(false)
      return
    }
    const q = query.trim()
    if (q.length < minChars) {
      abortRef.current?.abort()
      seqRef.current += 1
      setResults([])
      setStatus('idle')
      setActiveIndex(-1)
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(() => run(q), debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, minChars, debounceMs, enabled, run])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    seqRef.current += 1
    setQuery('')
    setResults([])
    setStatus('idle')
    setActiveIndex(-1)
    setOpen(false)
  }, [])

  const retry = useCallback(() => {
    const q = query.trim()
    if (q.length >= minChars) run(q)
  }, [query, minChars, run])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  return {
    query,
    setQuery,
    results,
    status,
    activeIndex,
    setActiveIndex,
    open,
    setOpen,
    reset,
    retry,
    close,
  }
}
