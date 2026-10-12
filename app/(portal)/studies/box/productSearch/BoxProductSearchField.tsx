import type { KeyboardEvent, RefObject } from 'react'

export default function BoxProductSearchField({
  inputId,
  inputRef,
  listId,
  showDropdown,
  activeDescendant,
  query,
  placeholder,
  barcodeQuery,
  onQuery,
  onKeyDown,
  onFocus,
}: {
  inputId: string
  inputRef: RefObject<HTMLInputElement | null>
  listId: string
  showDropdown: boolean
  activeDescendant?: string
  query: string
  placeholder: string
  barcodeQuery: boolean
  onQuery: (value: string) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  onFocus: () => void
}) {
  return (
    <input
      id={inputId}
      ref={inputRef}
      className="cb-input"
      role="combobox"
      aria-expanded={showDropdown}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={activeDescendant}
      value={query}
      placeholder={placeholder}
      autoComplete="off"
      inputMode={barcodeQuery ? 'numeric' : undefined}
      onChange={(e) => onQuery(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        height: 48,
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-sm)',
        padding: '0 16px',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        color: 'var(--ink)',
        background: 'var(--paper)',
        outline: 'none',
      }}
    />
  )
}
