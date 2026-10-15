'use client'

import CatPage from '@/components/categories/CatPage'
import '@/components/categories/categoriesPage.css'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import PrototypeEditor from './PrototypeEditor'
import './prototypesPage.css'
import { PrototypeCard } from './library/PrototypeCard'
import { PrototypesEmpty } from './library/PrototypesEmpty'
import { PrototypesHeader } from './library/PrototypesHeader'
import { PrototypesSummary } from './library/PrototypesSummary'
import { PrototypesToolbar } from './library/PrototypesToolbar'
import { usePrototypesLibrary } from './library/usePrototypesLibrary'

type Props = {
  brandId: number
  brandName: string
  initialItems: PrototypeListItem[]
  loadError?: string | null
}

export default function PrototypesClient({
  brandId,
  brandName,
  initialItems,
  loadError,
}: Props) {
  const {
    items,
    setItems,
    editing,
    setEditing,
    filter,
    setFilter,
    readyCount,
    needsCount,
    visible,
    upsert,
  } = usePrototypesLibrary(initialItems)

  return (
    <CatPage>
      <PrototypesHeader brandName={brandName} onAdd={() => setEditing('new')} />

      <PrototypesSummary itemCount={items.length} readyCount={readyCount} needsCount={needsCount} />

      {loadError ? (
        <p role="alert" className="proto-error">
          {loadError}
        </p>
      ) : null}

      {items.length > 0 ? <PrototypesToolbar filter={filter} setFilter={setFilter} /> : null}

      {items.length === 0 ? (
        <PrototypesEmpty onAdd={() => setEditing('new')} />
      ) : (
        <div className="proto-grid">
          {visible.map((item) => (
            <PrototypeCard key={item.id} item={item} onOpen={setEditing} />
          ))}
        </div>
      )}

      {editing != null ? (
        <PrototypeEditor
          brandId={brandId}
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
          onArchived={(id) => setItems((prev) => prev.filter((p) => p.id !== id))}
        />
      ) : null}
    </CatPage>
  )
}
