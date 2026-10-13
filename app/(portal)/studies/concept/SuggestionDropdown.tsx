'use client'

import type { ReactNode } from 'react'
import type { TypeaheadStatus } from '@/lib/concept/useTypeahead'
import SuggestionOptions from './suggestion/SuggestionOptions'
import SuggestionStatusRows from './suggestion/SuggestionStatusRows'
import { panelStyle } from './suggestion/suggestionStyles'

type Props<T> = {
  id: string
  status: TypeaheadStatus
  results: T[]
  activeIndex: number
  onActiveIndex: (i: number) => void
  onSelect: (item: T) => void
  onRetry: () => void
  getKey: (item: T) => string | number
  renderItem: (item: T) => ReactNode
  emptyLabel?: string
  /** Optional second line under the empty label. */
  emptyHint?: string
  /** Optional override for the retry row copy. */
  errorLabel?: string
  /** Optional: render an item as present-but-unselectable (e.g. already chosen). */
  isDisabled?: (item: T) => boolean
}

/**
 * Presentational typeahead list — always shows a status row (never a blank void).
 * Visual language aligned with CategoryCombobox / verification dropdown.
 */
export default function SuggestionDropdown<T>({
  id,
  status,
  results,
  activeIndex,
  onActiveIndex,
  onSelect,
  onRetry,
  getKey,
  renderItem,
  emptyLabel = 'No matches — try a different name.',
  emptyHint,
  errorLabel = 'Search failed — tap to retry',
  isDisabled,
}: Props<T>) {
  if (status === 'idle') return null

  return (
    <ul id={id} role="listbox" style={panelStyle}>
      <SuggestionStatusRows
        status={status}
        emptyLabel={emptyLabel}
        emptyHint={emptyHint}
        errorLabel={errorLabel}
        onRetry={onRetry}
      />
      <SuggestionOptions
        id={id}
        status={status}
        results={results}
        activeIndex={activeIndex}
        onActiveIndex={onActiveIndex}
        onSelect={onSelect}
        getKey={getKey}
        renderItem={renderItem}
        isDisabled={isDisabled}
      />
    </ul>
  )
}
