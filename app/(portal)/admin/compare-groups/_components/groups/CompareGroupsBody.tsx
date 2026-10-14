import type { CompareGroupListItem } from '@/lib/compareGroups.shared'
import { CompareGroupRow } from './CompareGroupRow'
import { CompareGroupsHead } from './CompareGroupsHead'
import type { SortKey } from './compareGroupChrome'

export function CompareGroupsBody({
  rows,
  sortKey,
  sortDir,
  toggleSort,
}: {
  rows: CompareGroupListItem[]
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  toggleSort: (key: SortKey) => void
}) {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <CompareGroupsHead sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: 'var(--ink-30)',
                  fontSize: 14,
                }}
              >
                No compare groups match these filters.
              </td>
            </tr>
          ) : (
            rows.map((g) => (
              <CompareGroupRow key={g.compare_group_id} g={g} />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
