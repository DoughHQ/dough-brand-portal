export function ImpersonateSearchInput({
  query,
  setQuery,
  searching,
}: {
  query: string
  setQuery: (value: string) => void
  searching: boolean
}) {
  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search brands by name…"
        aria-label="Search brands to impersonate"
        autoFocus
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid var(--ink-10)',
          background: 'var(--paper)',
          fontSize: 15,
          color: 'var(--ink)',
          fontFamily: 'var(--font-sans)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {searching ? (
        <div
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            color: 'var(--ink-30)',
            pointerEvents: 'none',
          }}
        >
          Searching…
        </div>
      ) : null}
    </div>
  )
}
