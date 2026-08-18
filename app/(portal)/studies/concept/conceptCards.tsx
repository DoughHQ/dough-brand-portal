'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import type { PackagingTemplateConfig } from '@/lib/concept/types'
import { NONE_OF_THESE } from '@/lib/concept/constants'
import { useTypeahead } from '@/lib/concept/useTypeahead'
import {
  brandVerificationOption,
  editableVerificationOptions,
  previewPriceBands,
  templateFieldAnchor,
} from '@/lib/concept/templateConfig'
import {
  formatPriceDisplay,
  normalizeExpectedPrice,
} from '@/lib/concept/priceBands'
import {
  searchVerificationBrandsAction,
  type VerificationBrandHit,
} from './actions'
import SuggestionDropdown from './SuggestionDropdown'
import { inputBase, labelSm } from './conceptStyles'

const AMBER = '#C07818'
const AMBER_SOFT = 'rgba(192, 120, 24, 0.12)'

/* ------------------------------------------------------------------ *
 * Shared primitives — used by every concept questionnaire editor.
 * ------------------------------------------------------------------ */

export function QCard({
  id,
  title,
  help,
  locked,
  lockLabel,
  children,
}: {
  id?: string
  title: string
  help: string
  locked?: boolean
  lockLabel?: string
  children?: ReactNode
}) {
  return (
    <div
      id={id}
      style={{
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-md)',
        padding: '20px 20px 18px',
        marginBottom: 14,
        background: locked ? 'var(--surface-1)' : 'var(--white)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 4,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: locked ? 'var(--ink-50)' : 'var(--ink-80)',
          }}
        >
          {title}
        </h3>
        {locked ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--ink-30)',
            }}
          >
            {lockLabel ?? 'SYSTEM-MANAGED'}
          </span>
        ) : null}
      </div>
      <p
        style={{
          margin: locked ? '0' : '0 0 16px',
          fontSize: 13,
          color: 'var(--ink-50)',
          lineHeight: 1.45,
        }}
      >
        {help}
      </p>
      {children}
    </div>
  )
}

export function Chip({
  label,
  selected,
  onToggle,
  removable,
  onRemove,
  tone = 'default',
  locked,
}: {
  label: string
  selected?: boolean
  onToggle?: () => void
  removable?: boolean
  onRemove?: () => void
  tone?: 'default' | 'sage' | 'amber' | 'muted'
  locked?: boolean
}) {
  const styles: Record<string, CSSProperties> = {
    default: {
      border: selected ? '1.5px solid var(--sage)' : '1px solid var(--ink-10)',
      background: selected ? 'var(--sage)' : 'var(--white)',
      color: selected ? 'var(--white)' : 'var(--ink)',
      fontWeight: selected ? 600 : 500,
    },
    sage: {
      border: '1.5px solid var(--sage)',
      background: 'var(--sage)',
      color: 'var(--white)',
      fontWeight: 600,
    },
    amber: {
      border: `1.5px solid ${AMBER}`,
      background: AMBER_SOFT,
      color: AMBER,
      fontWeight: 600,
    },
    muted: {
      border: '1px solid var(--ink-10)',
      background: 'var(--surface-1)',
      color: 'var(--ink-30)',
      fontWeight: 500,
    },
  }
  const base: CSSProperties = {
    ...styles[tone],
    borderRadius: 999,
    padding: removable ? '7px 10px 7px 12px' : '7px 12px',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }

  if (locked) {
    return (
      <span style={{ ...base, cursor: 'default' }}>
        {label}
        <span
          style={{
            marginLeft: 2,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.06em',
            opacity: 0.7,
          }}
        >
          LOCKED
        </span>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={removable ? onRemove : onToggle}
      style={{ ...base, cursor: 'pointer' }}
    >
      {label}
      {removable ? (
        <span aria-hidden style={{ fontSize: 14, lineHeight: 1, opacity: 0.85 }}>
          ×
        </span>
      ) : null}
    </button>
  )
}

export function BandStrip({ bands }: { bands: string[] }) {
  if (bands.length === 0) {
    return (
      <div
        style={{
          marginTop: 14,
          padding: '16px 12px',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface-1)',
          color: 'var(--ink-30)',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        Enter a price to preview answer bands
      </div>
    )
  }
  return (
    <div
      style={{
        marginTop: 14,
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 2,
      }}
    >
      {bands.map((b) => (
        <div
          key={b}
          style={{
            flex: '1 1 0',
            minWidth: 72,
            padding: '10px 8px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-10)',
            background: 'var(--surface-1)',
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {b}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Shared CARDS — identical in packaging + price modules.
 * Each takes the config + a patch fn + the field-error map.
 * ------------------------------------------------------------------ */

type CardProps = {
  config: PackagingTemplateConfig
  patchConfig: (partial: Partial<PackagingTemplateConfig>) => void
  errorByField: Map<string, string>
}

/**
 * Expected-price anchor + read-only generated band preview.
 * In price mode this anchors the willingness-to-pay scale; the copy differs
 * slightly but the mechanic is identical, so a `helpOverride` is accepted.
 */
export function ExpectedPriceCard({
  config,
  patchConfig,
  errorByField,
  helpOverride,
  labelOverride,
}: CardProps & { helpOverride?: string; labelOverride?: string }) {
  const bandPreview = previewPriceBands(config)
  return (
    <QCard
      id={templateFieldAnchor('expected_price')}
      title="Price expectation"
      help={
        helpOverride ??
        'What retail price should respondents expect? Answer bands generate from this anchor.'
      }
    >
      <label style={labelSm} htmlFor="expected_price">
        {labelOverride ?? 'Expected retail price'}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          maxWidth: 200,
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-sm)',
          background: 'var(--white)',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            padding: '9px 0 9px 11px',
            fontSize: 13,
            color: 'var(--ink-50)',
            userSelect: 'none',
          }}
        >
          $
        </span>
        <input
          id="expected_price"
          value={config.expected_price}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '')
            patchConfig({
              expected_price: raw,
              price_display: formatPriceDisplay(raw),
            })
          }}
          onBlur={() => {
            const normalized = normalizeExpectedPrice(config.expected_price)
            if (normalized !== config.expected_price) {
              patchConfig({
                expected_price: normalized,
                price_display: formatPriceDisplay(normalized),
              })
            }
          }}
          placeholder="4.99"
          inputMode="decimal"
          style={{ ...inputBase, border: 'none', borderRadius: 0, paddingLeft: 4 }}
        />
      </div>
      {normalizeExpectedPrice(config.expected_price) ? (
        <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--ink-30)' }}>
          Shown as {formatPriceDisplay(config.expected_price)}
        </p>
      ) : null}
      <BandStrip bands={bandPreview} />
      {errorByField.get('expected_price') ? (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red)' }}>
          {errorByField.get('expected_price')}
        </p>
      ) : null}
    </QCard>
  )
}

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
