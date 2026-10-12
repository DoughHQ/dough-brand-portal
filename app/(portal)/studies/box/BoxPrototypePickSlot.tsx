'use client'

import type { PrototypeListItem } from '@/lib/prototypes/types'
import PrototypeLibraryEmpty from './prototypePick/PrototypeLibraryEmpty'
import PrototypePickError from './prototypePick/PrototypePickError'
import PrototypeReadyList from './prototypePick/PrototypeReadyList'
import { useBoxPrototypePick } from './prototypePick/useBoxPrototypePick'

type Props = {
  /** Prototype ids already seated in this draft. */
  taken: Set<string>
  onPick: (item: PrototypeListItem, imageUrl: string | null) => void
  onCancel?: () => void
}

export default function BoxPrototypePickSlot({ taken, onPick, onCancel }: Props) {
  const model = useBoxPrototypePick(taken, onPick)

  return (
    <div
      style={{
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-md)',
        padding: 14,
        background: 'var(--paper)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-80)' }}>
          Choose a ready prototype
        </div>
        {onCancel ? (
          <button type="button" className="cb-quiet-action" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>

      {model.items == null ? (
        <p className="cb-field-note" style={{ margin: 0 }}>
          Loading library…
        </p>
      ) : model.error ? (
        <PrototypePickError message={model.error} />
      ) : model.ready.length === 0 ? (
        <PrototypeLibraryEmpty notReady={model.notReady} />
      ) : (
        <PrototypeReadyList
          ready={model.ready}
          taken={taken}
          pickingId={model.pickingId}
          onPick={(item) => void model.pick(item)}
        />
      )}
    </div>
  )
}
