import type { Dispatch, SetStateAction } from 'react'
import type { FilterKey, SortKey } from './l3Model'

export function L3RankToolbar({
  filteredLength,
  filter,
  setFilter,
  sort,
  setSort,
}: {
  filteredLength: number
  filter: FilterKey
  setFilter: Dispatch<SetStateAction<FilterKey>>
  sort: SortKey
  setSort: Dispatch<SetStateAction<SortKey>>
}) {
  const filtered = { length: filteredLength }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>
        Rankings
        <span style={{ fontSize: 11, color: 'var(--ink-30)', fontWeight: 400, marginLeft: 8 }}>
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {filter !== 'all' ? ` · ${filter === 'meaningful' ? 'statistically meaningful' : filter.replace('_', ' ')} filter` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            style={{ fontSize: 11, color: 'var(--ink-50)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            Clear filter ×
          </button>
        )}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-1)', borderRadius: 'var(--r-sm)', padding: 3 }}>
          {([['elo', 'ELO'], ['win_rate', 'Win rate'], ['battles', 'Battles']] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: sort === key ? 500 : 400,
                color: sort === key ? 'var(--ink)' : 'var(--ink-50)',
                background: sort === key ? 'var(--paper)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                boxShadow: sort === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
