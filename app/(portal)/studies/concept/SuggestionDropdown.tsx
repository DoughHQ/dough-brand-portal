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
  /** Optional second line under the empty label. */
  emptyHint?: string
  /** Optional override for the retry row copy. */
  errorLabel?: string
  /** Optional: render an item as present-but-unselectable (e.g. already chosen). */
  isDisabled?: (item: T) => boolean
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
  emptyHint,
  errorLabel = 'Search failed — tap to retry',
  isDisabled,
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
            {errorLabel}
          </button>
        </li>
      ) : null}
      {status === 'empty' ? (
        <li style={mutedRow} role="presentation">
          <div>{emptyLabel}</div>
          {emptyHint ? (
            <div style={{ marginTop: 4, color: 'var(--ink-30)' }}>{emptyHint}</div>
          ) : null}
        </li>
      ) : null}
      {status === 'success'
        ? results.map((item, i) => {
            const key = getKey(item)
            const active = i === activeIndex
            const off = isDisabled ? isDisabled(item) : false
            return (
              <li key={key} role="presentation">
                <button
                  type="button"
                  id={`${id}-opt-${key}`}
                  role="option"
                  aria-selected={active}
                  aria-disabled={off || undefined}
                  onMouseEnter={() => onActiveIndex(i)}
                  onClick={() => {
                    if (off) return
                    onSelect(item)
                  }}
                  style={{
                    ...rowStyle,
                    cursor: off ? 'default' : 'pointer',
                    background: active && !off ? 'var(--cb-sage-soft)' : 'transparent',
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
