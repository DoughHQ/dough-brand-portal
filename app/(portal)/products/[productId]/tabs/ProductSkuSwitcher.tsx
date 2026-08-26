'use client'

import { ComingSoonStub } from '@/components/productMaster/ComingSoonStub'
import './productDetailTabs.css'

export type SkuScopeOption = {
  id: number
  label: string
  barcode: string | null
}

export default function ProductSkuSwitcher({
  options,
  selectedId,
  canEdit,
  addSubject,
  onSelect,
}: {
  options: SkuScopeOption[]
  selectedId: number | null
  canEdit: boolean
  addSubject: string
  onSelect: (id: number) => void
}) {
  const selected = options.find((o) => o.id === selectedId) ?? null
  const showPicker = options.length > 1

  return (
    <div className="pm-sku-scope">
      <div className="pm-sku-scope-main">
        {options.length === 0 ? (
          <p className="pm-sku-scope-empty">No SKUs yet</p>
        ) : showPicker ? (
          <label className="pm-sku-scope-field">
            <span className="pm-sku-scope-label">SKU</span>
            <select
              className="pm-sku-scope-select"
              value={selectedId ?? ''}
              onChange={(e) => onSelect(Number(e.target.value))}
            >
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                  {opt.barcode ? ` · ${opt.barcode}` : ''}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="pm-sku-scope-one">
            <span className="pm-sku-scope-label">SKU</span>
            <span className="pm-sku-scope-name">{selected?.label}</span>
            {selected?.barcode ? (
              <span className="pm-sku-scope-gtin">
                <span className="pm-sku-scope-gtin-label">GTIN</span>
                {selected.barcode}
              </span>
            ) : null}
          </div>
        )}
      </div>
      {canEdit && (
        <ComingSoonStub label="+ Add SKU" subject={addSubject} className="pm-sku-add" />
      )}
    </div>
  )
}
