import type { ReactNode } from 'react'
import type { TypeaheadStatus } from '@/lib/concept/useTypeahead'
import { rowStyle } from './suggestionStyles'

export default function SuggestionOptions<T>({
  id,
  status,
  results,
  activeIndex,
  onActiveIndex,
  onSelect,
  getKey,
  renderItem,
  isDisabled,
}: {
  id: string
  status: TypeaheadStatus
  results: T[]
  activeIndex: number
  onActiveIndex: (i: number) => void
  onSelect: (item: T) => void
  getKey: (item: T) => string | number
  renderItem: (item: T) => ReactNode
  isDisabled?: (item: T) => boolean
}) {
  if (status !== 'success') return null

  return results.map((item, i) => {
    const key = getKey(item)
    const active = i === activeIndex
    const off = isDisabled ? isDisabled(item) : false
    return (
      <li key={key} role="presentation">
        <button
          type="button"
          id={`${id}-opt-${key}`}
          role="option"
          aria-selected={active}
          aria-disabled={off || undefined}
          onMouseEnter={() => onActiveIndex(i)}
          onClick={() => {
            if (off) return
            onSelect(item)
          }}
          style={{
            ...rowStyle,
            cursor: off ? 'default' : 'pointer',
            background: active && !off ? 'var(--cb-sage-soft)' : 'transparent',
          }}
        >
          {renderItem(item)}
        </button>
      </li>
    )
  })
}
