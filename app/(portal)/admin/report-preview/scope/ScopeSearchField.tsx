import type { useScopeSearch } from './useScopeSearch'
import { inputStyle } from './scopeChrome'
import { ScopeChip, StatusChip } from './scopeChips'

type Search = ReturnType<typeof useScopeSearch>

export function ScopeSearchField(search: Search) {
  const {
    listId, inputId, rootRef, inputRef, query, setQuery, results, status, activeIndex,
    setActiveIndex, setOpen, retry, choose, onKeyDown, showPanel, setFocused,
  } = search
  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        id={inputId}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showPanel && results[activeIndex]
            ? `${listId}-opt-${results[activeIndex]!.scope}-${results[activeIndex]!.scopeId}`
            : undefined
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          setFocused(true)
          setOpen(true)
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder="Search a category…"
        autoComplete="off"
        style={inputStyle}
      />
      {showPanel ? (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 50,
            left: 0,
            top: '100%',
            marginTop: 4,
            width: 360,
            maxHeight: 320,
            overflowY: 'auto',
            listStyle: 'none',
            padding: 0,
            margin: 0,
            background: 'var(--paper)',
            border: '1px solid var(--ink-10)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          {status === 'loading' ? (
            <li style={{ padding: 12, fontSize: 12, color: 'var(--ink-50)' }}>Searching…</li>
          ) : null}
          {status === 'error' ? (
            <li>
              <button
                type="button"
                onClick={retry}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  padding: 12,
                  fontSize: 12,
                  color: 'var(--red, #a33)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Search failed — tap to retry
              </button>
            </li>
          ) : null}
          {status === 'empty' ? (
            <li style={{ padding: 12, fontSize: 12, color: 'var(--ink-50)' }}>
              No matching scopes.
            </li>
          ) : null}
          {status === 'success'
            ? results.map((hit, i) => {
                const active = i === activeIndex
                return (
                  <li key={`${hit.scope}-${hit.scopeId}`} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-opt-${hit.scope}-${hit.scopeId}`}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(hit)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        borderBottom: '1px solid var(--ink-10)',
                        background: active ? 'var(--surface-1)' : 'transparent',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <ScopeChip scope={hit.scope} />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--ink)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {hit.name}
                        </span>
                        <span style={{ marginLeft: 'auto' }}>
                          <StatusChip status={hit.status} />
                        </span>
                      </div>
                      {hit.parentName ? (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--ink-50)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {hit.parentName}
                        </div>
                      ) : null}
                    </button>
                  </li>
                )
              })
            : null}
        </ul>
      ) : null}
    </div>
  )
}
