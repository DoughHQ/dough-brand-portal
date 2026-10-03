'use client'

import { useEffect, useState, type KeyboardEvent } from 'react'
import type { BoxFieldRow } from '@/lib/box/types'
import { BOX_UPC_SCAN_HELP } from '@/lib/box/constants'
import { barcodeChoiceLabel, barcodeDigits, looksLikeBarcode } from '@/lib/concept/barcodes'

type Props = {
  row: BoxFieldRow
  onSelectUpc: (upc: string) => void
  error?: string | null
  /**
   * Hero card: quieter confirmed state, help only when the barcode still needs work.
   * Contents rows keep the default always-on help.
   */
  density?: 'default' | 'hero'
}

const IDENTIFY = 'Identify the barcode on this package.'

export default function BoxUpcField({
  row,
  onSelectUpc,
  error,
  density = 'default',
}: Props) {
  const options = row.barcodeOptions ?? []
  const needsChoice = options.length > 1
  const [manual, setManual] = useState(row.upc ?? '')
  const [editing, setEditing] = useState(false)
  const hero = density === 'hero'
  const confirmed = !!row.upc?.trim() && !needsChoice && !editing

  useEffect(() => {
    setManual(row.upc ?? '')
    setEditing(false)
  }, [row.upc, row.localId])

  function commitManual() {
    const digits = barcodeDigits(manual)
    if (looksLikeBarcode(digits)) {
      onSelectUpc(digits)
      setEditing(false)
    }
  }

  function onManualKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitManual()
    }
  }

  const showDuplicateIdentify = error === IDENTIFY && !row.upc && !needsChoice
  const showHelp = !hero || !confirmed || !!error

  return (
    <div className={hero ? 'cb-box-upc is-hero' : 'cb-box-upc'}>
      {needsChoice ? (
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
      ) : confirmed ? (
        <div className="cb-box-upc-confirmed">
          <span className="cb-box-upc-code">UPC {row.upc}</span>
          {hero ? (
            <button
              type="button"
              className="cb-quiet-action"
              onClick={() => {
                setEditing(true)
                setManual(row.upc ?? '')
              }}
            >
              Edit
            </button>
          ) : null}
        </div>
      ) : (
        <div>
          <label style={{ ...legendStyle, display: 'block' }} htmlFor={`box-upc-manual-${row.localId}`}>
            {hero ? 'Package barcode' : IDENTIFY}
          </label>
          <input
            id={`box-upc-manual-${row.localId}`}
            className="cb-input"
            value={manual}
            placeholder="Paste the barcode from the package"
            inputMode="numeric"
            autoComplete="off"
            onChange={(e) => setManual(e.target.value)}
            onBlur={commitManual}
            onKeyDown={onManualKeyDown}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: hero ? 44 : 40,
              marginTop: 6,
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-sm)',
              padding: '0 12px',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
            }}
          />
          {hero && editing && row.upc ? (
            <button
              type="button"
              className="cb-quiet-action"
              style={{ marginTop: 8 }}
              onClick={() => {
                setEditing(false)
                setManual(row.upc ?? '')
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}
      {showHelp ? (
        <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--ink-50)' }}>
          {BOX_UPC_SCAN_HELP}
        </p>
      ) : hero ? (
        <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--ink-50)' }}>
          Respondents scan this package to prove they tried it.
        </p>
      ) : null}
      {error && !showDuplicateIdentify ? (
        <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

const legendStyle = {
  fontFamily: 'var(--font-sans)' as const,
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 6,
}
