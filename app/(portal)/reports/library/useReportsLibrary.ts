'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Purchase, Report } from './reportsModel'

export function useReportsLibrary({
  brandId,
  brandCategoryIdsProp,
}: {
  brandId: number
  brandCategoryIdsProp: number[]
}) {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [brandCategoryIds] = useState<Set<number>>(() => new Set(brandCategoryIdsProp))
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from('report_catalog')
        .select('*')
        .eq('is_published', true)
        .order('report_catalog_id')
        .then(({ data, error }) => {
          if (error) console.error('reports fetch error:', error)
          setReports((data ?? []) as Report[])
        }),
      supabase
        .from('report_purchases')
        .select('report_catalog_id')
        .eq('brand_id', brandId)
        .then(({ data }) => setPurchases((data ?? []) as Purchase[])),
    ]).then(() => setLoading(false))
  }, [brandId, supabase])

  const purchasedIds = new Set(purchases.map(p => p.report_catalog_id))

  const filtered = reports.filter(r => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || r.report_type === filterType
    return matchesSearch && matchesType
  })

  function sortReports(reportList: Report[]) {
    return [...reportList].sort((a, b) => {
      const aRelevant = a.taxonomy_node_id && brandCategoryIds.has(a.taxonomy_node_id) ? 1 : 0
      const bRelevant = b.taxonomy_node_id && brandCategoryIds.has(b.taxonomy_node_id) ? 1 : 0
      if (bRelevant !== aRelevant) return bRelevant - aRelevant
      return a.report_catalog_id - b.report_catalog_id
    })
  }

  return {
    reports,
    brandCategoryIds,
    search,
    setSearch,
    filterType,
    setFilterType,
    loading,
    purchasedIds,
    filtered,
    sortReports,
  }
}
