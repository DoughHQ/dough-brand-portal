export function CompareGroupsSearch({
  filter,
  setFilter,
  rows,
  groups,
}: {
  filter: string
  setFilter: (value: string) => void
  rows: { length: number }
  groups: { length: number }
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
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by name or question…"
        style={{
          flex: '1 1 240px',
          maxWidth: 360,
          padding: '9px 12px',
          borderRadius: 6,
          border: '1px solid var(--ink-10)',
          fontSize: 14,
          fontFamily: 'var(--font-sans)',
          boxSizing: 'border-box',
        }}
      />
      <span style={{ fontSize: 13, color: 'var(--ink-30)' }}>
        Showing {rows.length} of {groups.length}
      </span>
    </div>
  )
}
