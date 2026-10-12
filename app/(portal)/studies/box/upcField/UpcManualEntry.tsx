import type { KeyboardEvent, RefObject } from 'react'
import BarcodeGlyph from './BarcodeGlyph'

export default function UpcManualEntry({
  inputId,
  inputRef,
  manual,
  digits,
  canSave,
  editing,
  upc,
  onManualChange,
  onKeyDown,
  onCommit,
  onCancel,
}: {
  inputId: string
  inputRef: RefObject<HTMLInputElement | null>
  manual: string
  digits: string
  canSave: boolean
  editing: boolean
  upc: string | null
  onManualChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onCommit: () => void
  onCancel: () => void
}) {
  return (
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
          onChange={(e) => onManualChange(e.target.value)}
          onKeyDown={onKeyDown}
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
          onClick={onCommit}
        >
          Save barcode
        </button>
        {editing && upc ? (
          <button type="button" className="cb-quiet-action" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  )
}
