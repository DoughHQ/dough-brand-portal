'use client'

import type { AdminProductSearchResult } from '@/lib/queries'
import ProductEntryModeToggle from '../ProductEntryModeToggle'
import BoxProductSearchField from './productSearch/BoxProductSearchField'
import BoxProductSuggestions from './productSearch/BoxProductSuggestions'
import { useBoxProductSearch } from './productSearch/useBoxProductSearch'

type Props = {
  /** Product ids already used (focal + field), as strings. Disabled in the list. */
  taken: Set<string>
  onPick: (product: AdminProductSearchResult, knownUpc?: string) => void
  onCancel?: () => void
  placeholder?: string
  /** L2 node id to surface first ("encourage same area"). null = no preference. */
  preferL2NodeId?: number | null
  autoFocus?: boolean
  /** Name/Barcode toggle. On for hero and fill-the-box. */
  entryModes?: boolean
}

export default function BoxProductSearchSlot({
  taken,
  onPick,
  onCancel,
  placeholder = 'Search by name, brand, or barcode…',
  preferL2NodeId = null,
  autoFocus = true,
  entryModes = true,
}: Props) {
  const search = useBoxProductSearch({
    taken,
    onPick,
    onCancel,
    placeholder,
    preferL2NodeId,
    autoFocus,
    entryModes,
  })
  const active = search.ta.results[search.ta.activeIndex]

  return (
    <div ref={search.rootRef} style={{ position: 'relative' }}>
      {search.entryModes ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <ProductEntryModeToggle mode={search.mode} onChange={search.setExplicitMode} />
        </div>
      ) : null}
      <BoxProductSearchField
        inputId={search.inputId}
        inputRef={search.inputRef}
        listId={search.listId}
        showDropdown={search.showDropdown}
        activeDescendant={
          search.showDropdown && search.ta.status === 'success' && active
            ? `${search.listId}-opt-${active.product_id}`
            : undefined
        }
        query={search.ta.query}
        placeholder={search.fieldPlaceholder}
        barcodeQuery={search.barcodeQuery}
        onQuery={search.ta.setQuery}
        onKeyDown={search.handleKeyDown}
        onFocus={() => {
          if (search.ta.query.trim().length >= 2) search.ta.setOpen(true)
        }}
      />
      <BoxProductSuggestions
        showDropdown={search.showDropdown}
        listId={search.listId}
        status={search.ta.status}
        results={search.ta.results}
        activeIndex={search.ta.activeIndex}
        onActiveIndex={search.ta.setActiveIndex}
        onSelect={search.pickProduct}
        onRetry={search.ta.retry}
        taken={taken}
        barcodeTooShort={search.barcodeTooShort}
        barcodeQuery={search.barcodeQuery}
        digitsTyped={search.digitsTyped}
      />
    </div>
  )
}
