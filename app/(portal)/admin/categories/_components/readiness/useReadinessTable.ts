'use client'

import { useMemo, useState } from 'react'
import {
  countByStatus,
  isHideableEmpty,
  type ReadinessRow,
} from '@/lib/categoryReadiness.shared'
import type { SortKey } from './ReadinessSortBar'

type Props = {
  rows: ReadinessRow[]
  hideEmptyDefault: boolean
} & ({ level: 'l2' } | { level: 'l3'; parentL2Name: string })

export function useReadinessTable(props: Props) {
  const { rows, hideEmptyDefault, level } = props
  const parentL2Name = level === 'l3' ? props.parentL2Name : undefined
  const nameHeader = level === 'l2' ? 'L2' : 'L3'
  const showL1 = level === 'l2'
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('raters')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [hideEmpty, setHideEmpty] = useState(hideEmptyDefault)

  const statusCounts = useMemo(() => countByStatus(rows), [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = rows.filter((row) => {
      if (hideEmpty && isHideableEmpty(row)) return false
      if (!q) return true
      const hay = `${row.l1Name ?? ''} ${row.name}`.toLowerCase()
      return hay.includes(q)
    })
    list = [...list].sort((a, b) => {
      const av =
        sortKey === 'raters'
          ? a.distinctRaters
          : sortKey === 'battles'
            ? a.battles
            : a.productsBattled
      const bv =
        sortKey === 'raters'
          ? b.distinctRaters
          : sortKey === 'battles'
            ? b.battles
            : b.productsBattled
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return list
  }, [rows, query, hideEmpty, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
      return
    }
    setSortKey(key)
    setSortDir('desc')
  }

  const hiddenEmptyCount = rows.filter((r) => isHideableEmpty(r)).length

  return {
    rows,
    level,
    parentL2Name,
    nameHeader,
    showL1,
    query,
    setQuery,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    hideEmpty,
    setHideEmpty,
    statusCounts,
    filtered,
    toggleSort,
    hiddenEmptyCount,
  }
}
