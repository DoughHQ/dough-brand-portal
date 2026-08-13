'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { TypeaheadStatus } from '@/lib/concept/useTypeahead'

type Props<T> = {
  id: string
  status: TypeaheadStatus
  results: T[]
  activeIndex: number
  onActiveIndex: (i: number) => void
  onSelect: (item: T) => void
  onRetry: () => void
  getKey: (item: T) => string | number
  renderItem: (item: T) => ReactNode
  emptyLabel?: string
}

const panelStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 20,
  left: 0,
  right: 0,
  top: '100%',
  marginTop: 4,
  padding: 0,
  listStyle: 'none',
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-card)',
  boxShadow: 'var(--cb-shadow-popover)',
  maxHeight: 220,
  overflowY: 'auto',
}

const rowStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  border: 'none',
  borderBottom: '1px solid var(--cb-border-soft)',
  background: 'transparent',
  padding: 12,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--ink)',
}

const mutedRow: CSSProperties = {
  padding: 12,
  fontSize: 12,
  color: 'var(--ink-50)',
}

/**
 * Presentational typeahead list — always shows a status row (never a blank void).
 * Visual language aligned with CategoryCombobox / verification dropdown.
 */
export default function SuggestionDropdown<T>({
  id,
  status,
  results,
  activeIndex,
  onActiveIndex,
  onSelect,
  onRetry,
  getKey,
  renderItem,
  emptyLabel = 'No matches — try a different name.',
}: Props<T>) {
  if (status === 'idle') return null

  return (
    <ul id={id} role="listbox" style={panelStyle}>
      {status === 'loading' ? (
        <li style={mutedRow} role="presentation">
          Searching…
        </li>
      ) : null}
      {status === 'error' ? (
        <li role="presentation">
          <button
            type="button"
            onClick={onRetry}
            style={{ ...rowStyle, color: 'var(--red)', borderBottom: 'none' }}
          >
            Search failed — tap to retry
          </button>
        </li>
      ) : null}
      {status === 'empty' ? (
        <li style={mutedRow} role="presentation">
          {emptyLabel}
        </li>
      ) : null}
      {status === 'success'
        ? results.map((item, i) => {
            const key = getKey(item)
            const active = i === activeIndex
            return (
              <li key={key} role="presentation">
                <button
                  type="button"
                  id={`${id}-opt-${key}`}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => onActiveIndex(i)}
                  onClick={() => onSelect(item)}
                  style={{
                    ...rowStyle,
                    background: active ? 'var(--cb-sage-soft)' : 'transparent',
                  }}
                >
                  {renderItem(item)}
                </button>
              </li>
            )
          })
        : null}
    </ul>
  )
}
