'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FacetAvailableValue } from '@/lib/facets/productFacets'
import { FACET_LIST_SEARCH_THRESHOLD } from '@/lib/facets/productFacets'

type CommonProps = {
  options: FacetAvailableValue[]
  disabled?: boolean
  lockedValues?: Set<string>
}

/** Single-value searchable select — replaces long radio walls. */
export function FacetSearchSelect({
  options,
  value,
  lockedValues,
  disabled,
  placeholder = 'Search…',
  onChange,
}: CommonProps & {
  value: string | null
  placeholder?: string
  onChange: (value: string | null) => void
}) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value) ?? null
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = options.filter((o) => !lockedValues?.has(o.value))
    if (!q) return list
    return list.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    )
  }, [options, query, lockedValues])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const useSearch = options.length >= FACET_LIST_SEARCH_THRESHOLD

  if (!useSearch) {
    return (
      <select
        className="pf-control"
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={lockedValues?.has(o.value)}>
            {o.label}
            {lockedValues?.has(o.value) ? ' (Derived by Dough)' : ''}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="pf-combobox" ref={rootRef}>
      {selected ? (
        <div className="pf-combobox__picked">
          <span>{selected.label}</span>
          {!disabled ? (
            <button
              type="button"
              className="pf-chip__x"
              aria-label="Clear selection"
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
        className="pf-control"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={selected ? 'Change…' : placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {open ? (
        <ul id={listId} className="pf-combobox__list" role="listbox">
          {filtered.length === 0 ? (
            <li className="pf-combobox__empty">No matches</li>
          ) : (
            filtered.slice(0, 80).map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  className="pf-combobox__option"
                  onClick={() => {
                    onChange(o.value)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}

function remainingOptions(
  options: FacetAvailableValue[],
  takenValues: Set<string>,
  lockedValues?: Set<string>,
): FacetAvailableValue[] {
  return options.filter((o) => !takenValues.has(o.value) && !lockedValues?.has(o.value))
}

/** Multi-value: add from shortlist select or search — never free text. */
export function FacetChipAdd({
  options,
  takenValues,
  lockedValues,
  disabled,
  placeholder = 'Add a value…',
  onAdd,
}: CommonProps & {
  takenValues: Set<string>
  placeholder?: string
  onAdd: (value: string) => void
}) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const remaining = useMemo(
    () => remainingOptions(options, takenValues, lockedValues),
    [options, takenValues, lockedValues],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return remaining
    return remaining.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    )
  }, [remaining, query])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (remaining.length === 0) {
    return <p className="pf-add-exhausted">All values for this attribute are set.</p>
  }

  // Same threshold as single — short lists are a native select, not a freeform-looking search.
  if (remaining.length < FACET_LIST_SEARCH_THRESHOLD) {
    return (
      <select
        className="pf-control"
        disabled={disabled}
        value=""
        aria-label={placeholder}
        onChange={(e) => {
          const v = e.target.value
          if (v) onAdd(v)
        }}
      >
        <option value="">{placeholder}</option>
        {remaining.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="pf-combobox" ref={rootRef}>
      <input
        className="pf-control"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {open ? (
        <ul id={listId} className="pf-combobox__list" role="listbox">
          {filtered.length === 0 ? (
            <li className="pf-combobox__empty">No matches — pick from the list</li>
          ) : (
            filtered.slice(0, 80).map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  className="pf-combobox__option"
                  onClick={() => {
                    onAdd(o.value)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
