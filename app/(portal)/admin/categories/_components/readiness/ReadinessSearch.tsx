export function ReadinessSearch({
  query,
  setQuery,
  showL1,
  filtered,
  rows,
  hideEmpty,
  hiddenEmptyCount,
}: {
  query: string
  setQuery: (value: string) => void
  showL1: boolean
  filtered: { length: number }
  rows: { length: number }
  hideEmpty: boolean
  hiddenEmptyCount: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={showL1 ? 'Search categories…' : 'Search sub-categories…'}
        style={{
          flex: '1 1 240px',
          maxWidth: 360,
          padding: '9px 12px',
          borderRadius: 6,
          border: '1px solid var(--ink-10)',
          fontSize: 14,
          fontFamily: 'var(--font-sans)',
          boxSizing: 'border-box',
          background: 'var(--paper)',
          color: 'var(--ink)',
        }}
      />
      <span style={{ fontSize: 13, color: 'var(--ink-30)' }}>
        Showing {filtered.length} of {rows.length}
        {hideEmpty && hiddenEmptyCount > 0 ? ` · ${hiddenEmptyCount} empty hidden` : ''}
      </span>
    </div>
  )
}
