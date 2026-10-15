import type { PrototypeReadiness } from '@/lib/prototypes/types'

export function PrototypesToolbar({
  filter,
  setFilter,
}: {
  filter: 'all' | PrototypeReadiness
  setFilter: (key: 'all' | PrototypeReadiness) => void
}) {
  return (
    <div className="proto-toolbar">
      {(
        [
          ['all', 'All'],
          ['ready', 'Ready'],
          ['needs_allergens', 'Needs allergens'],
          ['needs_photo', 'Needs photo'],
          ['incomplete', 'Incomplete'],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={`prod-filter${filter === key ? ' prod-filter-on' : ''}`}
          onClick={() => setFilter(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
