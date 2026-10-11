'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { PricePosture, ProductCompetitorRow } from '@/lib/concept/types'
import { isAllowedPriceInput } from '@/lib/concept/price'
import {
  barcodeChoiceLabel,
  loadProductBarcodeState,
} from '@/lib/concept/barcodes'
import { CONCEPT_UPC_IDENTITY_HELP } from '@/lib/concept/constants'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
import { TrashIcon } from '../fieldIcons'
import { inputBase, labelSm } from '../conceptStyles'
import ProductIdentityConfirm from '../../ProductIdentityConfirm'

const thumbStyle = {
  width: 88,
  height: 88,
  flexShrink: 0,
  objectFit: 'contain' as const,
  display: 'block',
  background: 'var(--surface-1)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-media)',
}

export default function SelectedCompetitor({
  row,
  hidePrice,
  showMarketPrice,
  pricePosture,
  onChangeRow,
  onPatch,
  onReplace,
  onRemove,
  error,
  singleTestMode = false,
}: {
  row: ProductCompetitorRow
  hidePrice: boolean
  showMarketPrice?: boolean
  pricePosture: PricePosture
  error?: string
  onChangeRow: (next: ProductCompetitorRow) => void
  onPatch: (patch: Partial<ProductCompetitorRow>) => void
  onReplace: () => void
  onRemove: () => void
  singleTestMode?: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)
  useEffect(() => {
    setImgFailed(false)
  }, [row.product_id, row.frozen_image_url])

  useEffect(() => {
    if (row.product_id == null) return
    if (row.upc) return
    if ((row.barcodeOptions?.length ?? 0) > 0) return
    const productId = row.product_id
    let cancelled = false
    void (async () => {
      try {
        const state = await loadProductBarcodeState(createClient(), productId)
        if (cancelled) return
        onPatch({ upc: state.upc, barcodeOptions: state.barcodeOptions })
      } catch {
        /* validity will surface the missing SKU */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per unresolved product
  }, [row.product_id, row.upc, row.barcodeOptions?.length])

  const name = row.frozen_display_name || 'Untitled product'
  const barcodeOptions = row.barcodeOptions ?? []
  const awaitingConfirm = !!row.upc?.trim() && !isIdentityConfirmed(row)

  return (
    <div
      id={`field-seat-product-${row.localId}`}
      className="cb-comp-row"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        outline: error ? '1px solid var(--red)' : undefined,
        outlineOffset: error ? -1 : undefined,
      }}
    >
      {row.frozen_image_url && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.frozen_image_url}
          alt=""
          onError={() => setImgFailed(true)}
          style={thumbStyle}
        />
      ) : (
        <div style={{ ...thumbStyle, borderStyle: 'dashed', borderColor: 'var(--cb-border-strong)' }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--ink-80)',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 4 }}>
          {row.frozen_brand_name}
        </div>
        <div style={{ marginTop: 10 }}>
          {awaitingConfirm && row.upc ? (
            <ProductIdentityConfirm
              name={name}
              brand={row.frozen_brand_name}
              category={row.frozen_category ?? null}
              upc={row.upc}
              help={CONCEPT_UPC_IDENTITY_HELP}
              onConfirm={() => onPatch({ identityConfirmed: true })}
              onChange={onReplace}
            />
          ) : barcodeOptions.length > 1 && !row.upc ? (
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ ...labelSm, marginBottom: 6 }}>Which SKU was tested?</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {barcodeOptions.map((opt) => (
                  <label
                    key={opt.barcode}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: 13,
                      color: 'var(--ink-80)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name={`upc-${row.localId}`}
                      value={opt.barcode}
                      checked={row.upc === opt.barcode}
                      onChange={() => onPatch({ upc: opt.barcode })}
                      style={{ marginTop: 3 }}
                    />
                    <span>{barcodeChoiceLabel(opt)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className={singleTestMode ? 'cb-comp-upc' : undefined} style={singleTestMode ? undefined : { fontSize: 13, color: 'var(--ink-80)' }}>
              {row.upc ? `UPC ${row.upc}` : 'SKU not identified yet'}
            </div>
          )}
          {!awaitingConfirm && !singleTestMode ? (
            <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--cb-secondary)' }}>
              {CONCEPT_UPC_IDENTITY_HELP}
            </p>
          ) : null}
          {error && !awaitingConfirm ? (
            <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--red)' }}>
              {error}
            </p>
          ) : null}
        </div>
        {!hidePrice && !awaitingConfirm ? (
          <input
            className="cb-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`Price for ${name}`}
            value={row.frozen_price ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              if (!isAllowedPriceInput(raw)) return
              onChangeRow({ ...row, frozen_price: raw.trim() === '' ? null : raw })
            }}
            placeholder={pricePosture === 'blind' ? '—' : '4.99'}
            style={{ ...inputBase, height: 36, marginTop: 8, maxWidth: 120 }}
          />
        ) : null}
        {/* Price studies derive the WTP ladder from real shelf prices. Restored
            here when the competitor rows moved out of FieldSection in Pass 4B. */}
        {showMarketPrice && !awaitingConfirm ? (
          <div style={{ marginTop: 10 }}>
            <label style={{ ...labelSm, marginBottom: 4 }} htmlFor={`shelf-price-${row.localId}`}>
              Shelf price
            </label>
            <input
              id={`shelf-price-${row.localId}`}
              className="cb-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={row.market_reference_price ?? ''}
              onChange={(e) => {
                const raw = e.target.value
                if (!isAllowedPriceInput(raw)) return
                onChangeRow({
                  ...row,
                  market_reference_price: raw.trim() === '' ? null : raw,
                })
              }}
              placeholder="4.99"
              style={{ ...inputBase, height: 36, maxWidth: 120 }}
            />
            <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--cb-secondary)' }}>
              What it actually sells for. Sets the willingness-to-pay range from the
              real shelf instead of your expected price. Never shown to respondents.
            </p>
          </div>
        ) : null}
      </div>

      {!awaitingConfirm ? (
        <button
          type="button"
          onClick={onReplace}
          className="cb-btn-change"
          aria-label={`Change ${name}`}
        >
          Change
        </button>
      ) : null}
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--ink-50)',
          padding: 4,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <TrashIcon />
      </button>
    </div>
  )
}
