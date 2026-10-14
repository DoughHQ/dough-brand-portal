'use client'

import type { CompareGroupListItem } from '@/lib/compareGroups.shared'
import { CompareGroupsBody } from './groups/CompareGroupsBody'
import { CompareGroupsRangeFilters } from './groups/CompareGroupsRangeFilters'
import { CompareGroupsSearch } from './groups/CompareGroupsSearch'
import { CompareGroupsSortBar } from './groups/CompareGroupsSortBar'
import { CompareGroupsTodFilter } from './groups/CompareGroupsTodFilter'
import { useCompareGroups } from './groups/useCompareGroups'

export default function CompareGroupsTable({
  groups,
}: {
  groups: CompareGroupListItem[]
}) {
  const {
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
  } = useCompareGroups(groups)

  return (
    <div>
      <CompareGroupsSortBar activePreset={activePreset} applyPreset={applyPreset} />
      <CompareGroupsRangeFilters
        minBattles={minBattles}
        setMinBattles={setMinBattles}
        minRespondents={minRespondents}
        setMinRespondents={setMinRespondents}
      />
      <CompareGroupsTodFilter tod={tod} setTod={setTod} hasTodData={hasTodData} />
      <CompareGroupsSearch filter={filter} setFilter={setFilter} rows={rows} groups={groups} />
      <CompareGroupsBody rows={rows} sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />
    </div>
  )
}
