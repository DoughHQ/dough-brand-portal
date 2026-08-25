'use client'

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase'
import { useTypeahead } from '@/lib/concept/useTypeahead'
import {
  parseScopeSearchRows,
  SCOPE_CHIP_LABEL,
  type ScopeSearchHit,
} from '@/lib/categoryReport/scopeSearch'
import type { CategoryScope } from '@/lib/categoryReport/types'
import { isReadinessStatus, type ReadinessStatus } from '@/lib/categoryReadiness.shared'

type Props = {
  scope: CategoryScope | null
  scopeId: number | null
  scopeName: string | null
  onSelect: (hit: ScopeSearchHit) => void
  onClear: () => void
}

const STATUS_STYLE: Record<
  ReadinessStatus,
  { label: string; color: string; bg: string }
> = {
  empty: { label: 'Empty', color: 'var(--ink-30)', bg: 'var(--surface-1)' },
  building: { label: 'Building', color: 'var(--ink-50)', bg: 'var(--surface-1)' },
  approaching: { label: 'Approaching', color: 'var(--amber, #C07818)', bg: 'var(--amber-pale, #FAEEDA)' },
  sellable: { label: 'Sellable', color: 'var(--sage, #3E6B4A)', bg: 'var(--sage-pale, #eef5f0)' },
}

const inputStyle: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  background: 'var(--white)',
  color: 'var(--ink)',
  width: 280,
}

async function fetchScopes(query: string, signal: AbortSignal): Promise<ScopeSearchHit[]> {
  const q = query.trim()
  const { data, error } = await createClient().rpc(
    'admin_scope_search',
    q.length ? { p_query: q } : {}
  )
  if (signal.aborted) return []
  if (error) throw new Error(error.message)
  return parseScopeSearchRows(data)
}

function StatusChip({ status }: { status: string }) {
  const style = isReadinessStatus(status) ? STATUS_STYLE[status] : null
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: style?.color ?? 'var(--ink-30)',
        background: style?.bg ?? 'var(--surface-1)',
        padding: '1px 6px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {style?.label ?? status}
    </span>
  )
}

function ScopeChip({ scope }: { scope: CategoryScope }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--ink-50)',
        border: '1px solid var(--ink-10)',
        padding: '1px 6px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {SCOPE_CHIP_LABEL[scope]}
    </span>
  )
}

export default function ScopeSearch({ scope, scopeId, scopeName, onSelect, onClear }: Props) {
  const listId = useId()
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasSelection = scope != null && scopeId != null
  const [editing, setEditing] = useState(!hasSelection)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (hasSelection) setEditing(false)
  }, [hasSelection, scope, scopeId])

  const {
    query,
    setQuery,
    results,
    status,
    activeIndex,
    setActiveIndex,
    open,
    setOpen,
    reset,
    retry,
    close,
  } = useTypeahead<ScopeSearchHit>(fetchScopes, {
    minChars: 0,
    debounceMs: 250,
    enabled: editing && focused,
  })

  useEffect(() => {
    if (!editing || !hasSelection) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [editing, hasSelection])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        close()
        if (hasSelection) {
          setEditing(false)
          reset()
        }
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, hasSelection, close, reset])

  function choose(hit: ScopeSearchHit) {
    onSelect(hit)
    setEditing(false)
    reset()
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (hasSelection) {
        setEditing(false)
        reset()
      } else {
        close()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const hit = results[activeIndex]
      if (hit) choose(hit)
    }
  }

  const displayName = scopeName?.trim() || (scopeId != null ? String(scopeId) : '')

  if (!editing && hasSelection) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            reset()
            setEditing(true)
          }}
          title="Change category"
          style={{
            ...inputStyle,
            width: 'auto',
            minWidth: 200,
            maxWidth: 360,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <ScopeChip scope={scope} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}
          >
            {displayName}
          </span>
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear category"
          style={{
            ...inputStyle,
            width: 'auto',
            padding: '8px 10px',
            color: 'var(--ink-50)',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
    )
  }

  const showPanel = editing && (status !== 'idle' || open)

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
            background: 'var(--white)',
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
