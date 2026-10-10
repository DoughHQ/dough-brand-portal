'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  fetchCanDeclare,
  fetchDistribution,
  fetchPendingReports,
  type Capability,
} from '@/lib/distribution/api'
import type {
  AvailabilityReport,
  DistributionRow,
} from '@/lib/distribution/grouping'

export default function useDistributionData(productId: number) {
  const [stateProductId, setStateProductId] = useState(productId)
  const [capability, setCapability] = useState<Capability | null>(null)
  const [rows, setRows] = useState<DistributionRow[]>([])
  const [reports, setReports] = useState<AvailabilityReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadGeneration = useRef(0)
  const dataProductId = useRef(productId)

  const load = useCallback(async () => {
    const generation = ++loadGeneration.current
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const capabilityResult = await fetchCanDeclare(supabase, productId)
    if (generation !== loadGeneration.current) return
    const productChanged = dataProductId.current !== productId
    dataProductId.current = productId
    setStateProductId(productId)
    if (capabilityResult.error) {
      setCapability(null)
      setRows([])
      setReports([])
      setError(capabilityResult.error)
      setLoading(false)
      return
    }
    setCapability(capabilityResult.capability)
    if (productChanged) {
      setRows([])
      setReports([])
    }
    if (!capabilityResult.capability.allowed) {
      setRows([])
      setReports([])
      setLoading(false)
      return
    }
    const [distributionResult, pendingResult] = await Promise.all([
      fetchDistribution(supabase, productId),
      fetchPendingReports(supabase, productId),
    ])
    if (generation !== loadGeneration.current) return
    if (distributionResult.error) setError(distributionResult.error)
    else if (pendingResult.error) setError(pendingResult.error)
    setRows(distributionResult.rows)
    setReports(pendingResult.reports)
    setLoading(false)
  }, [productId])

  useEffect(() => {
    void load()
    return () => {
      loadGeneration.current += 1
    }
  }, [load])

  const isCurrentProduct = stateProductId === productId
  return {
    capability: isCurrentProduct ? capability : null,
    rows: isCurrentProduct ? rows : [],
    reports: isCurrentProduct ? reports : [],
    loading: isCurrentProduct ? loading : true,
    error: isCurrentProduct ? error : null,
    setError,
    load,
  }
}
