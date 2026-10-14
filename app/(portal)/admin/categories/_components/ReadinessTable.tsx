'use client'

import type { ReadinessRow } from '@/lib/categoryReadiness.shared'
import { ReadinessSearch } from './readiness/ReadinessSearch'
import { ReadinessSortBar } from './readiness/ReadinessSortBar'
import { ReadinessStatusStrip } from './readiness/ReadinessStatusStrip'
import { ReadinessTableBody } from './readiness/ReadinessTableBody'
import { useReadinessTable } from './readiness/useReadinessTable'

type Props = {
  rows: ReadinessRow[]
  hideEmptyDefault: boolean
} & ({ level: 'l2' } | { level: 'l3'; parentL2Name: string })

export default function ReadinessTable(props: Props) {
  const {
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
  } = useReadinessTable(props)

  return (
    <div>
      <ReadinessStatusStrip statusCounts={statusCounts} />
      <ReadinessSortBar
        sortKey={sortKey}
        sortDir={sortDir}
        setSortKey={setSortKey}
        setSortDir={setSortDir}
        hideEmpty={hideEmpty}
        setHideEmpty={setHideEmpty}
      />
      <ReadinessSearch
        query={query}
        setQuery={setQuery}
        showL1={showL1}
        filtered={filtered}
        rows={rows}
        hideEmpty={hideEmpty}
        hiddenEmptyCount={hiddenEmptyCount}
      />

      <ReadinessTableBody
        showL1={showL1}
        nameHeader={nameHeader}
        sortKey={sortKey}
        sortDir={sortDir}
        toggleSort={toggleSort}
        filtered={filtered}
        rows={rows}
        level={level}
        parentL2Name={parentL2Name}
      />
    </div>
  )
}
