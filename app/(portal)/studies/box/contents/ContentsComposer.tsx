import type { AdminProductSearchResult } from '@/lib/queries'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import BoxProductSearchSlot from '../BoxProductSearchSlot'
import BoxPrototypePickSlot from '../BoxPrototypePickSlot'
import type { Composer } from './types'

export default function ContentsComposer({
  composer,
  isEmpty,
  takenProducts,
  takenPrototypes,
  preferL2NodeId,
  onOpenIntent,
  onCancel,
  onCatalogPick,
  onPrototypePick,
}: {
  composer: NonNullable<Composer>
  isEmpty: boolean
  takenProducts: Set<string>
  takenPrototypes: Set<string>
  preferL2NodeId: number | null
  onOpenIntent: (intent: NonNullable<Composer>['intent']) => void
  onCancel: () => void
  onCatalogPick: (p: AdminProductSearchResult, knownUpc?: string) => void
  onPrototypePick: (item: PrototypeListItem, imageUrl: string | null) => void
}) {
  const panelStyle = {
    border: '1px dashed var(--ink-10)',
    borderRadius: 'var(--r-md)',
    padding: 14,
    background: isEmpty ? 'var(--paper)' : 'var(--surface-1)',
  }
  if (
    composer.intent === 'yours_catalog' ||
    composer.intent === 'competitor_catalog'
  ) {
    return (
      <div style={panelStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 10,
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-80)' }}>
            {composer.replaceLocalId
              ? 'Replace with a catalog product'
              : composer.intent === 'competitor_catalog'
                ? 'Add a competitor product'
                : 'Add your catalog product'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!composer.replaceLocalId ? (
              <button
                type="button"
                className="cb-quiet-action"
                onClick={() => onOpenIntent('yours_prototype')}
              >
                Use a prototype instead
              </button>
            ) : null}
            <button type="button" className="cb-quiet-action" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
        <BoxProductSearchSlot
          taken={takenProducts}
          onPick={onCatalogPick}
          onCancel={onCancel}
          preferL2NodeId={preferL2NodeId}
          entryModes
          placeholder={
            composer.intent === 'competitor_catalog'
              ? 'Search competitors by name, brand, or barcode…'
              : 'Search your product by name, brand, or barcode…'
          }
        />
      </div>
    )
  }
  if (composer.intent === 'yours_prototype') {
    return (
      <div style={panelStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 10,
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-80)' }}>
            {composer.replaceLocalId
              ? 'Replace with a prototype'
              : 'Add your prototype'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!composer.replaceLocalId ? (
              <button
                type="button"
                className="cb-quiet-action"
                onClick={() => onOpenIntent('yours_catalog')}
              >
                Use a catalog product instead
              </button>
            ) : null}
            <button type="button" className="cb-quiet-action" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
        <BoxPrototypePickSlot
          taken={takenPrototypes}
          onPick={onPrototypePick}
          onCancel={onCancel}
        />
      </div>
    )
  }
  return null
}
