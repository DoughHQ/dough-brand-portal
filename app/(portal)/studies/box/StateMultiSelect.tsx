'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  canonicalizeTargetStates,
  filterUsStates,
  stateDisplayName,
  type UsState,
} from '@/lib/box/usStates'

type Props = {
  selected: string[]
  onChange: (codes: string[]) => void
}

export default function StateMultiSelect({ selected, onChange }: Props) {
  const listId = useId()
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const options = filterUsStates(query, selected)
  const active = options[activeIndex] ?? null

  useEffect(() => {
    setActiveIndex(0)
  }, [query, selected])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function emit(next: string[]) {
    onChange(canonicalizeTargetStates(next))
  }

  function add(state: UsState) {
    emit([...selected, state.code])
    setQuery('')
    setActiveIndex(0)
    inputRef.current?.focus()
  }

  function remove(token: string) {
    emit(selected.filter((s) => s !== token))
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQuery('')
      return
    }
    if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      e.preventDefault()
      emit(selected.slice(0, -1))
      return
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, Math.max(options.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active) add(active)
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', maxWidth: 520 }}>
      <div
        style={{
          ...fieldShell,
          borderColor: open ? 'var(--sage)' : 'var(--ink-10)',
        }}
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
      >
        {selected.map((token) => (
          <span key={token} style={chip}>
            {stateDisplayName(token)}
            <button
              type="button"
              aria-label={`Remove ${stateDisplayName(token)}`}
              onClick={(ev) => {
                ev.stopPropagation()
                remove(token)
              }}
              style={chipX}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          ref={inputRef}
          role="combobox"
          aria-label="Search ship-to states"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={active ? `${listId}-${active.code}` : undefined}
          value={query}
          onChange={(ev) => {
            setQuery(ev.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected.length === 0 ? 'Search states…' : ''}
          style={inputInField}
        />
      </div>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          style={dropdown}
        >
          {options.length === 0 ? (
            <li
              role="presentation"
              style={{
                padding: '10px 12px',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--ink-50)',
              }}
            >
              {query.trim() ? 'No matching states' : 'All states selected'}
            </li>
          ) : (
            options.map((s, i) => {
              const isActive = i === activeIndex
              return (
                <li
                  key={s.code}
                  id={`${listId}-${s.code}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(ev) => {
                    ev.preventDefault()
                    add(s)
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: isActive ? 'var(--sage-soft)' : 'transparent',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: 'var(--ink)',
                  }}
                >
                  <span>{s.name}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--ink-50)',
                    }}
                  >
                    {s.code}
                  </span>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}

const fieldShell = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'center',
  gap: 8,
  minHeight: 48,
  boxSizing: 'border-box' as const,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '6px 10px',
  background: 'var(--white)',
  cursor: 'text',
}

const inputInField = {
  flex: '1 1 140px',
  minWidth: 120,
  height: 32,
  border: 'none',
  padding: '0 4px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'transparent',
  outline: 'none',
  boxShadow: 'none',
}

const dropdown = {
  position: 'absolute' as const,
  zIndex: 20,
  left: 0,
  right: 0,
  top: 'calc(100% + 4px)',
  maxHeight: 260,
  overflowY: 'auto' as const,
  margin: 0,
  padding: '4px 0',
  listStyle: 'none',
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--cb-shadow-popover)',
}

const chip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-80)',
  background: 'var(--surface-1)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-pill)',
  padding: '5px 6px 5px 12px',
}

const chipX = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  color: 'var(--ink-50)',
  padding: '0 4px',
}
