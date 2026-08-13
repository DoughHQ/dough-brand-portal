'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  searchTaxonomyNodesAction,
  type TaxonomyNodeInfo,
} from './actions'
import { labelSm } from './conceptStyles'

type Props = {
  selected: TaxonomyNodeInfo | null
  required?: boolean
  onSelect: (node: TaxonomyNodeInfo) => void
  onClear: () => void
  error?: string | null
}

export default function CategoryCombobox({
  selected,
  required,
  onSelect,
  onClear,
  error,
}: Props) {
  const listId = useId()
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TaxonomyNodeInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const t = setTimeout(() => {
      void searchTaxonomyNodesAction(q).then((rows) => {
        if (cancelled) return
        setResults(rows)
        setActiveIndex(0)
        setLoading(false)
      })
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query, open])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function choose(n: TaxonomyNodeInfo) {
    onSelect(n)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
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

  if (selected) {
    return (
      <div id="concept-category">
        <div style={labelSm}>Category</div>
        <div className="cb-combobox-selected">
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink-80)',
              }}
            >
              {selected.node_name_display}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--ink-50)',
                marginTop: 2,
              }}
            >
              {selected.breadcrumb}
            </div>
          </div>
          <button
            type="button"
            aria-label="Clear category"
            onClick={onClear}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              color: 'var(--ink-30)',
              padding: 6,
            }}
          >
            ×
          </button>
        </div>
        {error ? (
          <p role="alert" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--red)' }}>
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  const showPanel = open && query.trim().length >= 2

  return (
    <div id="concept-category" ref={rootRef} className="cb-combobox">
      <label style={labelSm} htmlFor={inputId}>
        {required ? (
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--amber)',
              marginRight: 6,
              verticalAlign: 'middle',
            }}
          />
        ) : null}
        Category
      </label>
      <div style={{ position: 'relative' }}>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--ink-30)',
            pointerEvents: 'none',
            display: 'flex',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id={inputId}
          className="cb-input"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showPanel && results[activeIndex]
              ? `${listId}-${results[activeIndex]!.taxonomy_node_id}`
              : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search categories…"
          autoComplete="off"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: 48,
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-sm)',
            padding: '0 40px 0 40px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--ink)',
            background: 'var(--white)',
          }}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--ink-30)',
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        ) : null}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-50)' }}>
        Search by category name. Field and questionnaire unlock after you pick one.
      </p>

      {showPanel ? (
        <div className="cb-combobox-panel" id={listId} role="listbox">
          {loading ? (
            <div style={{ padding: '14px 12px', fontSize: 13, color: 'var(--ink-50)' }}>
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '14px 12px', fontSize: 13, color: 'var(--ink-50)' }}>
              No matching categories.
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '8px 12px 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-30)',
                }}
              >
                Suggested
              </div>
              {results.map((n, i) => (
                <button
                  key={n.taxonomy_node_id}
                  type="button"
                  id={`${listId}-${n.taxonomy_node_id}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  data-active={i === activeIndex}
                  className="cb-combobox-option"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => choose(n)}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--ink-80)',
                    }}
                  >
                    {n.node_name_display}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 2 }}>
                    {n.breadcrumb}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}

      {error ? (
        <p role="alert" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
