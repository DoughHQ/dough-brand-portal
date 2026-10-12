'use client'

import type { BoxFieldRow } from '@/lib/box/types'
import UpcChoiceList from './upcField/UpcChoiceList'
import UpcConfirmedCode from './upcField/UpcConfirmedCode'
import UpcManualEntry from './upcField/UpcManualEntry'
import { useBoxUpcField } from './upcField/useBoxUpcField'

type Props = {
  row: BoxFieldRow
  onSelectUpc: (upc: string) => void
  error?: string | null
}

/**
 * Shared package-barcode control for Setup hero and Build the field rows.
 */
export default function BoxUpcField({ row, onSelectUpc, error }: Props) {
  const field = useBoxUpcField(row, onSelectUpc, error)

  return (
    <div className="cb-box-upc is-hero">
      <div className="cb-box-upc-label-row">
        <span className="cb-box-upc-label">Package barcode</span>
        {field.confirmed ? (
          <span className="cb-box-upc-pill" data-ok="true">
            On the package
          </span>
        ) : (
          <span className="cb-box-upc-pill">Required</span>
        )}
      </div>

      {field.needsChoice ? (
        <UpcChoiceList row={row} options={field.options} onSelectUpc={onSelectUpc} />
      ) : field.confirmed ? (
        <UpcConfirmedCode
          upc={row.upc!}
          onChange={() => {
            field.setEditing(true)
            field.setManual(row.upc ?? '')
          }}
        />
      ) : (
        <UpcManualEntry
          inputId={field.inputId}
          inputRef={field.inputRef}
          manual={field.manual}
          digits={field.digits}
          canSave={field.canSave}
          editing={field.editing}
          upc={row.upc}
          onManualChange={field.setManual}
          onKeyDown={field.onManualKeyDown}
          onCommit={field.commitManual}
          onCancel={() => {
            field.setEditing(false)
            field.setManual(row.upc ?? '')
          }}
        />
      )}

      <p className="cb-box-upc-help">
        {field.confirmed
          ? 'Respondents scan this code to prove they tried the product.'
          : 'Must match the physical package. Wrong code = they can’t finish or get paid.'}
      </p>
      {error && !field.showDuplicateIdentify ? (
        <p role="alert" className="cb-box-upc-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
