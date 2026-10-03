'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { BoxFieldRow } from '@/lib/box/types'
import {
  barcodeChoiceLabel,
  barcodeDigits,
  formatUpcDisplay,
  looksLikeBarcode,
} from '@/lib/concept/barcodes'

type Props = {
  row: BoxFieldRow
  onSelectUpc: (upc: string) => void
  error?: string | null
}

const IDENTIFY = 'Identify the barcode on this package.'

/**
 * Shared package-barcode control for Setup hero and Build the field rows.
 */
export default function BoxUpcField({ row, onSelectUpc, error }: Props) {
  const options = row.barcodeOptions ?? []
  const needsChoice = options.length > 1
  const [manual, setManual] = useState(row.upc ?? '')
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmed = !!row.upc?.trim() && !needsChoice && !editing
  const digits = barcodeDigits(manual)
  const canSave = looksLikeBarcode(digits)
  const inputId = `box-upc-manual-${row.localId}`
  const showDuplicateIdentify = error === IDENTIFY && !row.upc && !needsChoice

  useEffect(() => {
    setManual(row.upc ?? '')
    setEditing(false)
  }, [row.upc, row.localId])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commitManual() {
    const next = barcodeDigits(manual)
    if (!looksLikeBarcode(next)) return
    onSelectUpc(next)
    setEditing(false)
  }

  function onManualKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitManual()
    }
    if (e.key === 'Escape' && editing && row.upc) {
      e.preventDefault()
      setEditing(false)
      setManual(row.upc)
    }
  }

  return (
    <div className="cb-box-upc is-hero">
      <div className="cb-box-upc-label-row">
        <span className="cb-box-upc-label">Package barcode</span>
        {confirmed ? (
          <span className="cb-box-upc-pill" data-ok="true">
            On the package
          </span>
        ) : (
          <span className="cb-box-upc-pill">Required</span>
        )}
      </div>

      {needsChoice ? (
        <ChoiceList row={row} options={options} onSelectUpc={onSelectUpc} />
      ) : confirmed ? (
        <div className="cb-box-upc-confirmed">
          <span className="cb-box-upc-glyph" aria-hidden>
            <BarcodeGlyph />
          </span>
          <span className="cb-box-upc-code">{formatUpcDisplay(row.upc!)}</span>
          <button
            type="button"
            className="cb-btn-outline cb-box-upc-edit"
            onClick={() => {
              setEditing(true)
              setManual(row.upc ?? '')
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <div className="cb-box-upc-entry">
          <div className="cb-box-upc-field">
            <span className="cb-box-upc-glyph" aria-hidden>
              <BarcodeGlyph />
            </span>
            <input
              id={inputId}
              ref={inputRef}
              className="cb-box-upc-input"
              value={manual}
              placeholder="Scan or type the digits on the package"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Package barcode"
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={onManualKeyDown}
            />
            {digits.length > 0 ? (
              <span className="cb-box-upc-count" data-ok={canSave ? 'true' : 'false'}>
                {digits.length}
              </span>
            ) : null}
          </div>
          <div className="cb-box-upc-actions">
            <button
              type="button"
              className="cb-btn cb-btn-primary"
              disabled={!canSave}
              onClick={commitManual}
            >
              Save barcode
            </button>
            {editing && row.upc ? (
              <button
                type="button"
                className="cb-quiet-action"
                onClick={() => {
                  setEditing(false)
                  setManual(row.upc ?? '')
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      )}

      <p className="cb-box-upc-help">
        {confirmed
          ? 'Respondents scan this code to prove they tried the product.'
          : 'Must match the physical package. Wrong code = they can’t finish or get paid.'}
      </p>
      {error && !showDuplicateIdentify ? (
        <p role="alert" className="cb-box-upc-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function ChoiceList({
  row,
  options,
  onSelectUpc,
}: {
  row: BoxFieldRow
  options: NonNullable<BoxFieldRow['barcodeOptions']>
  onSelectUpc: (upc: string) => void
}) {
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend style={legendStyle}>Which barcode is on the package that ships?</legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {options.map((opt) => (
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
              name={`box-upc-${row.localId}`}
              value={opt.barcode}
              checked={row.upc === opt.barcode}
              onChange={() => onSelectUpc(opt.barcode)}
              style={{ marginTop: 3 }}
            />
            <span>
              {opt.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.image_url}
                  alt=""
                  width={20}
                  height={20}
                  style={{
                    width: 20,
                    height: 20,
                    objectFit: 'contain',
                    verticalAlign: 'middle',
                    marginRight: 6,
                    background: 'var(--surface-1)',
                    borderRadius: 3,
                  }}
                />
              ) : null}
              {barcodeChoiceLabel(opt)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function BarcodeGlyph() {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden>
      <path
        d="M1 1v14M3.5 1v14M5 1v14M8 1v14M9.5 1v14M12.5 1v14M14 1v14M16.5 1v14M19 1v14"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

const legendStyle = {
  fontFamily: 'var(--font-sans)' as const,
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 6,
}
