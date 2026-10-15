import { allergenSummary } from '@/lib/prototypes/allergens'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import { CardArt, ReadinessPill } from './prototypeArt'

export function PrototypeCard({
  item,
  onOpen,
}: {
  item: PrototypeListItem
  onOpen: (item: PrototypeListItem) => void
}) {
  return (
    <button
      type="button"
      className="proto-card"
      onClick={() => onOpen(item)}
    >
      <CardArt path={item.image_paths[0] ?? null} />
      <div className="proto-card-body">
        <div className="proto-card-top">
          <ReadinessPill readiness={item.readiness} />
          <span className="proto-pack">
            {item.packaging === 'final_packaging' ? 'Final pack' : 'Plain sample'}
          </span>
        </div>
        <div className="proto-card-name">{item.name}</div>
        {item.internal_label ? (
          <div className="proto-card-internal">{item.internal_label}</div>
        ) : null}
        <div className="proto-card-meta">
          {item.category_label ?? 'Category'}
          {item.planned_price != null ? ` · $${item.planned_price.toFixed(2)}` : ''}
        </div>
        <div className="proto-card-allergens">
          {item.allergens_declared_at != null
            ? allergenSummary(
                item.allergens_contains ?? [],
                item.allergens_may_contain ?? []
              )
            : 'Allergens not declared'}
        </div>
      </div>
    </button>
  )
}
