import type { AdminProductSearchResult } from '@/lib/queries'
import type { TypeaheadStatus } from '@/lib/concept/useTypeahead'
import SuggestionDropdown from '../../concept/SuggestionDropdown'
import BoxProductSuggestion from './BoxProductSuggestion'

export default function BoxProductSuggestions({
  showDropdown,
  listId,
  status,
  results,
  activeIndex,
  onActiveIndex,
  onSelect,
  onRetry,
  taken,
  barcodeTooShort,
  barcodeQuery,
  digitsTyped,
}: {
  showDropdown: boolean
  listId: string
  status: TypeaheadStatus
  results: AdminProductSearchResult[]
  activeIndex: number
  onActiveIndex: (index: number) => void
  onSelect: (item: AdminProductSearchResult) => void
  onRetry: () => void
  taken: Set<string>
  barcodeTooShort: boolean
  barcodeQuery: boolean
  digitsTyped: number
}) {
  if (!showDropdown) return null
  return (
    <SuggestionDropdown<AdminProductSearchResult>
      id={listId}
      status={status}
      results={results}
      activeIndex={activeIndex}
      onActiveIndex={onActiveIndex}
      onSelect={onSelect}
      onRetry={onRetry}
      getKey={(item) => item.product_id}
      isDisabled={(item) => taken.has(String(item.product_id))}
      emptyLabel={
        barcodeTooShort
          ? 'Keep typing the full barcode (8–14 digits).'
          : barcodeQuery
            ? 'No product matches that barcode.'
            : 'No products match — try a different name.'
      }
      emptyHint={
        barcodeTooShort
          ? `${digitsTyped} digit${digitsTyped === 1 ? '' : 's'} so far.`
          : barcodeQuery
            ? 'Check the digits against the package, or switch to Name.'
            : undefined
      }
      errorLabel="Barcode lookup failed — tap to retry"
      renderItem={(item) => <BoxProductSuggestion item={item} taken={taken} />}
    />
  )
}
