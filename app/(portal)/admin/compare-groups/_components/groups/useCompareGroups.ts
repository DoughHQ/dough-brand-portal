'use client'

import { useMemo, useState } from 'react'
import type { CompareGroupListItem } from '@/lib/compareGroups.shared'
import { type SortKey, type SortPreset, type TodFilter } from './compareGroupChrome'

export function useCompareGroups(groups: CompareGroupListItem[]) {
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [minBattles, setMinBattles] = useState(0)
  const [minRespondents, setMinRespondents] = useState(0)
  const [tod, setTod] = useState<TodFilter>('any')

  const hasTodData = useMemo(
    () => groups.some((g) => g.peak_bucket != null || g.has_time_priors),
    [groups]
  )

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    let list = groups

    if (q) {
      list = list.filter(
        (g) =>
          (g.name ?? '').toLowerCase().includes(q) ||
          (g.consumer_question ?? '').toLowerCase().includes(q) ||
          (g.code ?? '').toLowerCase().includes(q)
      )
    }
    if (minBattles > 0) {
      list = list.filter((g) => (g.battle_count ?? 0) >= minBattles)
    }
    if (minRespondents > 0) {
      list = list.filter((g) => (g.respondent_count ?? 0) >= minRespondents)
    }
    if (tod === 'none') {
      list = list.filter((g) => !g.has_time_priors && !g.peak_bucket)
    } else if (tod !== 'any') {
      list = list.filter((g) => g.peak_bucket === tod)
    }

    const sorted = [...list].sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0
      if (sortKey === 'name') {
        av = (a.name ?? '').toLowerCase()
        bv = (b.name ?? '').toLowerCase()
      } else if (sortKey === 'battles') {
        av = a.battle_count ?? 0
        bv = b.battle_count ?? 0
      } else if (sortKey === 'products') {
        av = a.product_count ?? 0
        bv = b.product_count ?? 0
      } else {
        av = a.respondent_count ?? 0
        bv = b.respondent_count ?? 0
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [groups, filter, sortKey, sortDir, minBattles, minRespondents, tod])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  function applyPreset(preset: SortPreset) {
    if (preset === 'name') {
      setSortKey('name')
      setSortDir('asc')
      return
    }
    setSortKey(preset)
    setSortDir('desc')
  }

  const activePreset: SortPreset | null =
    sortKey === 'name' && sortDir === 'asc'
      ? 'name'
      : sortKey === 'respondents' && sortDir === 'desc'
        ? 'respondents'
        : sortKey === 'battles' && sortDir === 'desc'
          ? 'battles'
          : null

  return {
    groups,
    filter,
    setFilter,
    sortKey,
    sortDir,
    minBattles,
    setMinBattles,
    minRespondents,
    setMinRespondents,
    tod,
    setTod,
    hasTodData,
    rows,
    toggleSort,
    applyPreset,
    activePreset,
  }
}
