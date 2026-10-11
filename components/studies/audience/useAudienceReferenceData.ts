'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getTaxonomyNodeAction,
} from '@/app/(portal)/studies/audienceActions'
import {
  groupDietaryFlags,
  type DietaryFlagDef,
} from '@/lib/studies/audience/dietaryFlags'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'
import { createClient } from '@/lib/supabase'

type LoadStatus = 'loading' | 'ready' | 'error'

export function useAudienceReferenceData(
  qualifyingTaxonomyNodeId: number | null,
  logContext: 'box' | 'concept'
) {
  const [qualifyingNode, setQualifyingNode] =
    useState<TaxonomyNodeInfo | null>(null)
  const [dietaryFlags, setDietaryFlags] = useState<DietaryFlagDef[]>([])
  const [dietaryStatus, setDietaryStatus] = useState<LoadStatus>('loading')

  useEffect(() => {
    let cancelled = false
    const query = createClient()
      .from('dietary_flag_definitions')
      .select('flag_code, label, category, display_order')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('flag_code')

    void Promise.resolve(query)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error(`[${logContext}] dietary_flag_definitions`, error)
          setDietaryStatus('error')
          return
        }
        setDietaryFlags((data ?? []) as DietaryFlagDef[])
        setDietaryStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error(`[${logContext}] dietary_flag_definitions`, error)
        setDietaryStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [logContext])

  useEffect(() => {
    if (qualifyingTaxonomyNodeId == null) {
      setQualifyingNode(null)
      return
    }
    setQualifyingNode(null)
    let cancelled = false
    void getTaxonomyNodeAction(qualifyingTaxonomyNodeId)
      .then((node) => {
        if (!cancelled) setQualifyingNode(node)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error(`[${logContext}] getTaxonomyNodeAction`, error)
        setQualifyingNode(null)
      })
    return () => {
      cancelled = true
    }
  }, [logContext, qualifyingTaxonomyNodeId])

  const dietaryGroups = useMemo(
    () => groupDietaryFlags(dietaryFlags),
    [dietaryFlags]
  )
  const dietaryLabels = useMemo(
    () =>
      Object.fromEntries(
        dietaryFlags.map((flag) => [flag.flag_code, flag.label])
      ) as Record<string, string>,
    [dietaryFlags]
  )

  return {
    dietaryGroups,
    dietaryLabels,
    dietaryStatus,
    qualifyingNode,
    setQualifyingNode,
  }
}
