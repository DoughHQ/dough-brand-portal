import { useEffect, useRef, useState } from 'react'
import {
  getBrandCategoryLauncher,
  parseBrandCategoryLauncher,
  CategoryLauncherError,
  type BrandCategoryLauncher,
} from '@/lib/categoryLauncher'
import { SEARCH_DEBOUNCE_MS } from './launcherModel'

export type CategoryLauncherState = ReturnType<typeof useCategoryLauncher>

export function useCategoryLauncher() {
  const [data, setData] = useState<BrandCategoryLauncher | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const baselineRef = useRef<BrandCategoryLauncher | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    void getBrandCategoryLauncher(debouncedSearch || null)
      .then((payload) => {
        if (cancelled) return
        if (!debouncedSearch) {
          baselineRef.current = payload
          setData(payload)
        } else {
          const base = baselineRef.current
          setData({
            owned: base?.owned ?? payload.owned,
            has_products: base?.has_products ?? payload.has_products,
            browse: payload.browse,
            search: payload.search,
          })
        }
        setError(null)
        setReady(true)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof CategoryLauncherError && err.code === 'no_effective_brand') {
          setError(err.message)
          setData(null)
          setReady(true)
          return
        }
        setError(null)
        setData(parseBrandCategoryLauncher(null))
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  return {
    data,
    ready,
    error,
    searchInput,
    setSearchInput,
    debouncedSearch,
  }
}
