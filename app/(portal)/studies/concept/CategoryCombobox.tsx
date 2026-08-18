'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  searchTaxonomyNodesAction,
  type TaxonomyNodeInfo,
} from './actions'
import { inputBase, labelSm } from './conceptStyles'

type Props = {
  selected: TaxonomyNodeInfo | null
  /**
   * §34 — the draft already knows a category is chosen before the taxonomy fetch
   * resolves. Rendering the chip shell immediately keeps the section's height
   * stable instead of swapping a search input for a chip on load.
   */
  pendingNodeId?: number | null
  required?: boolean
  onSelect: (node: TaxonomyNodeInfo) => void
  onClear: () => void
  error?: string | null
}

/** Small semantic close mark. Replaces an 18px text glyph masquerading as an icon. */
function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden focusable="false">
      <path
        d="M3 3l6 6M9 3l-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function CategoryCombobox({
  selected,
  pendingNodeId,
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

  if (selected || pendingNodeId != null) {
    const pending = !selected
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
                color: pending ? 'var(--cb-secondary)' : 'var(--cb-heading)',
              }}
            >
              {selected ? selected.node_name_display : 'Loading category…'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--cb-secondary)',
                marginTop: 2,
                minHeight: 16,
              }}
            >
              {selected ? selected.breadcrumb : ''}
            </div>
          </div>
          <button
            type="button"
            className="cb-icon-btn"
            // Distinct from the confirmation dialog's "Clear category" action, so
            // the two never collide in the accessibility tree while it is open.
            aria-label={selected ? `Clear category ${selected.node_name_display}` : 'Clear category'}
            disabled={pending}
            onClick={onClear}
          >
            <CloseIcon />
          </button>
        </div>
        {error ? (
          <p role="alert" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--cb-error)' }}>
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  // §35 — one character used to produce silence. The panel now opens as soon as
  // the operator types, and says why it has nothing yet.
  const typed = query.trim().length
  const showPanel = open && typed >= 1
  const belowThreshold = typed > 0 && typed < 2

  return (
    <div id="concept-category" ref={rootRef} className="cb-combobox">
      <label style={labelSm} htmlFor={inputId}>
        {required ? <span aria-hidden className="cb-required-dot" /> : null}
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
            color: 'var(--cb-secondary)',
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
            showPanel && !belowThreshold && results[activeIndex]
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
          // Was a hand-copied duplicate of the shared control recipe, which could
          // silently drift from it. Now it IS the shared recipe, with only the
          // icon padding overridden.
          style={{ ...inputBase, padding: '0 48px 0 40px' }}
        />
        {query ? (
          <button
            type="button"
            className="cb-icon-btn cb-icon-btn-inset"
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--cb-secondary)' }}>
        Choose a study type and category to unlock Field, Questions, and Battle settings.
      </p>

      {showPanel ? (
        <div className="cb-combobox-panel" id={listId} role="listbox">
          {belowThreshold ? (
            <div style={{ padding: '14px 12px', fontSize: 13, color: 'var(--cb-secondary)' }}>
              Type at least 2 characters
            </div>
          ) : loading ? (
            <div style={{ padding: '14px 12px', fontSize: 13, color: 'var(--cb-secondary)' }}>
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '14px 12px', fontSize: 13, color: 'var(--cb-secondary)' }}>
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
