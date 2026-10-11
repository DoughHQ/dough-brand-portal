'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  boxDraftToQualifierArgs,
  rpcCountBoxQualifiers,
  type CountBoxQualifiersArgs,
  type CountBoxQualifiersResult,
} from '@/lib/box/countQualifiers'
import type { BoxStudyDraft } from '@/lib/box/types'
import { createClient } from '@/lib/supabase'

const QUALIFIER_DEBOUNCE_MS = 350

export function useBoxQualifierEstimate(draft: BoxStudyDraft) {
  const [count, setCount] = useState<CountBoxQualifiersResult | null>(null)
  const [loading, setLoading] = useState(false)
  const args = useMemo(() => boxDraftToQualifierArgs(draft), [draft])
  const argsKey = JSON.stringify(args)

  useEffect(() => {
    const qualifierArgs = JSON.parse(
      argsKey
    ) as CountBoxQualifiersArgs | null
    if (!qualifierArgs) {
      setCount(null)
      setLoading(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      void rpcCountBoxQualifiers(createClient(), qualifierArgs)
        .then((result) => {
          if (!cancelled) setCount(result)
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            console.error('[box] count_box_qualifiers', error)
            setCount(null)
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, QUALIFIER_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [argsKey])

  const qualifyingUsers = count?.qualifying_users
  const headline =
    draft.focalProductId == null
      ? 'Choose a hero product to see who qualifies'
      : qualifyingUsers == null
        ? loading
          ? 'Estimating…'
          : '—'
        : `~${qualifyingUsers.toLocaleString()} people qualify`

  return {
    count,
    headline,
    loading,
    qualifyingUsers,
  }
}
