'use client'

import type { ProductEntryMode } from '@/lib/productEntryMode'
import ProductEntryModeTab from './entryMode/ProductEntryModeTab'

type Props = {
  mode: ProductEntryMode
  onChange: (mode: ProductEntryMode) => void
}

export default function ProductEntryModeToggle({ mode, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Search by name or barcode"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {(['name', 'barcode'] as const).map((value) => (
        <ProductEntryModeTab
          key={value}
          value={value}
          active={mode === value}
          onChange={onChange}
        />
      ))}
    </div>
  )
}
