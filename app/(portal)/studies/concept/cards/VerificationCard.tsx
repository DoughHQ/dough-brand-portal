'use client'

import { useCallback, useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { NONE_OF_THESE } from '@/lib/concept/constants'
import { useTypeahead } from '@/lib/concept/useTypeahead'
import {
  brandVerificationOption,
  editableVerificationOptions,
  templateFieldAnchor,
} from '@/lib/concept/templateConfig'
import {
  searchVerificationBrandsAction,
  type VerificationBrandHit,
} from '../conceptCatalogActions'
import SuggestionDropdown from '../SuggestionDropdown'
import { inputBase, labelSm } from '../conceptStyles'
import type { CardProps } from './cardTypes'
import { Chip } from './Chip'
import { QCard } from './QCard'

/**
 * Purchase-verification screener: brand search → chips → decoy → none-of-these.
 * Identical across modes (it's a universal-spine screener).
 */
export function VerificationCard({ config, patchConfig, errorByField }: CardProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const verificationEditable = editableVerificationOptions(config)
  const hasVerification = verificationEditable.length >= 2

  const fetchBrands = useCallback(async (q: string, _signal: AbortSignal) => {
    return searchVerificationBrandsAction(q)
  }, [])

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
  } = useTypeahead<VerificationBrandHit>(fetchBrands)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close])

  function addBrand(hit: VerificationBrandHit) {
    if (!verificationEditable.some((b) => b.brand_id === hit.brand_id)) {
      patchConfig({
        verification_options: [
          ...verificationEditable,
          brandVerificationOption(hit.brand_id, hit.label),
        ],
      })
    }
    reset()
  }

  function removeBrand(brandId: number) {
    patchConfig({
      verification_options: verificationEditable.filter((b) => b.brand_id !== brandId),
    })
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const hit = results[activeIndex]
      if (hit && status === 'success') addBrand(hit)
    }
  }

  const showDropdown = open && status !== 'idle'

  return (
    <QCard
      id={templateFieldAnchor('verification_options')}
      title="Purchase Verification"
      help="Which brands should qualify a respondent? Search and add real brands; we’ll append an attention-check decoy and “None of these”."
    >
      <label style={labelSm} htmlFor="verification-brand-search">
        Search brands
      </label>
      <div ref={rootRef} style={{ position: 'relative', marginBottom: 14 }}>
        <input
          id="verification-brand-search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showDropdown && status === 'success' && results[activeIndex]
              ? `${listId}-opt-${results[activeIndex]!.brand_id}`
              : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true)
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a brand name…"
          style={inputBase}
          autoComplete="off"
        />
        {showDropdown ? (
          <SuggestionDropdown
            id={listId}
            status={status}
            results={results}
            activeIndex={activeIndex}
            onActiveIndex={setActiveIndex}
            onSelect={addBrand}
            onRetry={retry}
            getKey={(h) => h.brand_id}
            renderItem={(hit) => (
              <>
                {hit.label}
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--ink-30)' }}>
                  {hit.product_count} products
                </span>
              </>
            )}
          />
        ) : null}
      </div>

      <div style={{ ...labelSm, marginBottom: 8 }}>Selected brands</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {verificationEditable.map((b) => (
          <Chip
            key={b.id}
            label={b.label}
            tone="sage"
            removable
            onRemove={() => removeBrand(b.brand_id)}
          />
        ))}
        {hasVerification && config.decoy_option.trim() ? (
          <Chip
            label={config.decoy_option.trim()}
            tone="amber"
            removable
            onRemove={() => patchConfig({ decoy_option: '' })}
          />
        ) : null}
        <Chip label={NONE_OF_THESE} tone="muted" locked />
      </div>

      {hasVerification || verificationEditable.length > 0 ? (
        <div id={templateFieldAnchor('decoy_option')}>
          <label style={labelSm} htmlFor="decoy_option">
            Attention-check decoy
          </label>
          <input
            id="decoy_option"
            value={config.decoy_option}
            onChange={(e) => patchConfig({ decoy_option: e.target.value })}
            placeholder="Fake brand name (e.g. Verdant Fizz)"
            style={inputBase}
          />
          {errorByField.get('decoy_option') ? (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--red)' }}>
              {errorByField.get('decoy_option')}
            </p>
          ) : null}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-50)' }}>
          Optional — you can publish without verification brands (we’ll confirm).
        </p>
      )}
      {errorByField.get('verification_options') ? (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red)' }}>
          {errorByField.get('verification_options')}
        </p>
      ) : null}
    </QCard>
  )
}
