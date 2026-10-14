import type { CSSProperties, Dispatch, SetStateAction } from 'react'

export type SortKey = 'raters' | 'battles' | 'products'

function chipStyle(active: boolean): CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 999,
    border: active ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
    background: active ? 'var(--sage-pale, #eef5f0)' : 'var(--paper)',
    color: active ? 'var(--sage)' : 'var(--ink-50)',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  }
}

export function ReadinessSortBar({
  sortKey,
  sortDir,
  setSortKey,
  setSortDir,
  hideEmpty,
  setHideEmpty,
}: {
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  setSortKey: (key: SortKey) => void
  setSortDir: (dir: 'asc' | 'desc') => void
  hideEmpty: boolean
  setHideEmpty: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--ink-30)', marginRight: 4 }}>
        Sort
      </span>
      {(
        [
          ['raters', 'Most raters'],
          ['battles', 'Most battles'],
          ['products', 'Most products'],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => {
            setSortKey(key)
            setSortDir('desc')
          }}
          style={chipStyle(sortKey === key && sortDir === 'desc')}
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setHideEmpty((v) => !v)}
        style={chipStyle(hideEmpty)}
      >
        Hide empty
      </button>
    </div>
  )
}
