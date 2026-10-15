'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useTypeahead } from '@/lib/concept/useTypeahead'
import type { ScopeSearchHit } from '@/lib/categoryReport/scopeSearch'
import type { CategoryScope } from '@/lib/categoryReport/types'
import { fetchScopes } from './scopeFetch'

export function useScopeSearch({
  scope,
  scopeId,
  scopeName,
  onSelect,
}: {
  scope: CategoryScope | null
  scopeId: number | null
  scopeName: string | null
  onSelect: (hit: ScopeSearchHit) => void
}) {
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
  const showPanel = editing && (status !== 'idle' || open)
  return {
    scope,
    scopeId,
    listId,
    inputId,
    rootRef,
    inputRef,
    hasSelection,
    editing,
    setEditing,
    setFocused,
    query,
    setQuery,
    results,
    status,
    activeIndex,
    setActiveIndex,
    setOpen,
    reset,
    retry,
    choose,
    onKeyDown,
    displayName,
    showPanel,
  }
}
