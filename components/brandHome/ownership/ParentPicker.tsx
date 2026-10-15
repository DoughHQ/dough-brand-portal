import type { OwnershipCorrectionState } from './useOwnershipCorrection'

export function ParentPicker({
  loadingOptions,
  optionsError,
  selected,
  setSelected,
  query,
  setQuery,
  filtered,
}: Pick<
  OwnershipCorrectionState,
  'loadingOptions' | 'optionsError' | 'selected' | 'setSelected' | 'query' | 'setQuery' | 'filtered'
>) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 6,
        }}
      >
        Parent company
      </div>
      {loadingOptions ? (
        <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>Loading companies…</div>
      ) : optionsError ? (
        <div style={{ fontSize: 13, color: 'var(--red, #b42318)' }}>{optionsError}</div>
      ) : (
        <>
          <input
            value={selected ? selected.display_name : query}
            onChange={(e) => {
              setSelected(null)
              setQuery(e.target.value)
            }}
            placeholder="Search companies…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 12px',
              borderRadius: 6,
              border: '1px solid var(--ink-10)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--ink)',
              outline: 'none',
            }}
          />
          {!selected && query.trim().length > 0 ? (
            <div
              style={{
                marginTop: 4,
                maxHeight: 180,
                overflow: 'auto',
                border: '1px solid var(--ink-10)',
                borderRadius: 6,
                background: 'var(--paper)',
              }}
            >
              {filtered.length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ink-30)' }}>
                  No matches
                </div>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.conglomerate_id}
                    type="button"
                    onClick={() => {
                      setSelected(o)
                      setQuery(o.display_name)
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      border: 'none',
                      borderBottom: '1px solid var(--mist, var(--ink-10))',
                      background: 'transparent',
                      fontSize: 13,
                      color: 'var(--ink)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {o.display_name}
                  </button>
                ))
              )}
            </div>
          ) : null}
          {selected ? (
            <button
              type="button"
              onClick={() => {
                setSelected(null)
                setQuery('')
              }}
              style={{
                marginTop: 6,
                fontSize: 11,
                color: 'var(--ink-30)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Clear selection
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
