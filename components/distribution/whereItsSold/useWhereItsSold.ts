'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  coordFromRow,
  serializeCoord,
  type DistributionCoord,
} from '@/lib/distribution/coords'
import {
  claimableSeedRows,
  filterRowsByBannerQuery,
  partitionDistribution,
  seedPeekNames,
  shouldShowBannerFilter,
} from '@/lib/distribution/grouping'
import useDistributionActions from './useDistributionActions'
import useDistributionData from './useDistributionData'

export default function useWhereItsSold(
  productId: number,
  focusCoord: DistributionCoord | null,
) {
  const data = useDistributionData(productId)
  const actions = useDistributionActions({
    productId,
    load: data.load,
    setError: data.setError,
  })
  const [bannerQuery, setBannerQuery] = useState('')
  const [seedsOpen, setSeedsOpen] = useState(false)

  useEffect(() => {
    setBannerQuery('')
    setSeedsOpen(false)
  }, [productId])

  useEffect(() => {
    if (!focusCoord || data.loading) return
    const focusKey = serializeCoord(focusCoord)
    const inSeeds = data.rows.some(
      (row) =>
        serializeCoord(coordFromRow(row)) === focusKey &&
        !row.needs_attention &&
        row.brand_status == null,
    )
    if (inSeeds) setSeedsOpen(true)
    const timeout = window.setTimeout(() => {
      const element = document.getElementById(`coord-${focusKey}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    return () => window.clearTimeout(timeout)
  }, [data.loading, data.rows, focusCoord])

  const filteredRows = useMemo(
    () => filterRowsByBannerQuery(data.rows, bannerQuery),
    [data.rows, bannerQuery],
  )
  const sections = useMemo(
    () => partitionDistribution(filteredRows),
    [filteredRows],
  )
  const seedSection = sections.find((section) => section.id === 'dough_seeds')
  const claimable = useMemo(
    () => claimableSeedRows(seedSection?.rows ?? []),
    [seedSection],
  )
  const seedPeek = useMemo(
    () => seedPeekNames(seedSection?.rows ?? []),
    [seedSection],
  )
  const showFilter = shouldShowBannerFilter(data.rows.length)
  const needsCount =
    sections.find((section) => section.id === 'needs_review')?.rows.length ?? 0

  return {
    capability: data.capability,
    rows: data.rows,
    reports: data.reports,
    loading: data.loading,
    error: data.error,
    busy: actions.busy,
    toast: actions.toast,
    modal: actions.modal,
    setModal: actions.setModal,
    bannerQuery,
    setBannerQuery,
    seedsOpen,
    setSeedsOpen,
    sections,
    claimable,
    seedPeek,
    showFilter,
    needsCount,
    runDeclare: actions.runDeclare,
    onClaimAll: actions.onClaimAll,
    onDelist: actions.onDelist,
    onDispute: actions.onDispute,
    cardHandlers: actions.cardHandlers,
  }
}
