'use client'

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

const SEARCH_THRESHOLD = 8

export default function SearchCombobox<
  T extends { id: string; label: string },
>({
  label,
  options,
  valueId,
  placeholder,
  disabled,
  onChange,
}: {
  label: string
  options: T[]
  valueId: string | null
  placeholder: string
  disabled?: boolean
  onChange: (id: string | null) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const selected = options.find((option) => option.id === valueId) ?? null
  const useSearch = options.length >= SEARCH_THRESHOLD

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    )
  }, [options, query])
  const visibleOptions = filtered.slice(0, 100)

  function select(option: T) {
    onChange(option.id)
    setQuery('')
    setOpen(false)
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      if (open) {
        event.stopPropagation()
        setOpen(false)
      }
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => {
        if (visibleOptions.length === 0) return -1
        const delta = event.key === 'ArrowDown' ? 1 : -1
        const start = current < 0 ? (delta > 0 ? -1 : 0) : current
        return (start + delta + visibleOptions.length) % visibleOptions.length
      })
      return
    }
    if (event.key === 'Enter' && open && visibleOptions[activeIndex]) {
      event.preventDefault()
      select(visibleOptions[activeIndex])
    }
  }

  useEffect(() => {
    if (!open) return
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocumentMouseDown)
    return () =>
      document.removeEventListener('mousedown', onDocumentMouseDown)
  }, [open])

  if (!useSearch) {
    return (
      <select
        aria-label={label}
        disabled={disabled}
        value={valueId ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="wis-combobox" ref={rootRef}>
      {selected ? (
        <div className="wis-picked">
          <span>{selected.label}</span>
          {!disabled ? (
            <button
              type="button"
              className="wis-btn wis-btn--quiet"
              aria-label="Clear"
              onClick={() => {
                onChange(null)
                setQuery('')
              }}
            >
              ×
            </button>
          ) : null}
        </div>
      ) : null}
      <input
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && visibleOptions[activeIndex]
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        disabled={disabled}
        placeholder={selected ? 'Change…' : placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => {
          setOpen(true)
          setActiveIndex(-1)
        }}
        onKeyDown={onInputKeyDown}
      />
      {open ? (
        <ul
          id={listboxId}
          className="wis-combobox__list"
          role="listbox"
          aria-label={`${label} options`}
        >
          {filtered.length === 0 ? (
            <li className="wis-combobox__empty">No matches</li>
          ) : (
            visibleOptions.map((option, index) => (
              <li key={option.id} role="none">
                <button
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={option.id === valueId}
                  className="wis-combobox__option"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(option)}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
