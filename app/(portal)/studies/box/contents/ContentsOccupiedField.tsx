import type { AdminProductSearchResult } from '@/lib/queries'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import type { BoxFieldRow } from '@/lib/box/types'
import ContentsAddActions from './ContentsAddActions'
import ContentsComposer from './ContentsComposer'
import ContentsFieldNotes from './ContentsFieldNotes'
import ContentsSeatCard from './ContentsSeatCard'
import type { Composer, ComposerIntent } from './types'

type Props = {
  rows: BoxFieldRow[]
  composer: Composer
  taxonomyNodeId: number | null
  rowErrors: Record<string, string>
  takenProducts: Set<string>
  takenPrototypes: Set<string>
  preferL2NodeId: number | null
  canAdd: boolean
  overBy: number
  missingUpcCount: number
  unconfirmedCount: number
  openComposer: (intent: ComposerIntent, replace?: BoxFieldRow) => void
  cancelComposer: () => void
  addCatalog: (product: AdminProductSearchResult, knownUpc?: string) => void
  addPrototype: (item: PrototypeListItem, imageUrl: string | null) => void
  removeRow: (localId: string) => void
  patchRow: (localId: string, next: BoxFieldRow) => void
}

export default function ContentsOccupiedField({
  rows,
  composer,
  taxonomyNodeId,
  rowErrors,
  takenProducts,
  takenPrototypes,
  preferL2NodeId,
  canAdd,
  overBy,
  missingUpcCount,
  unconfirmedCount,
  openComposer,
  cancelComposer,
  addCatalog,
  addPrototype,
  removeRow,
  patchRow,
}: Props) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row) => {
          if (composer?.replaceLocalId === row.localId) return null
          return (
            <ContentsSeatCard
              key={row.localId}
              row={row}
              taxonomyNodeId={taxonomyNodeId}
              rowError={rowErrors[row.localId]}
              onPatch={(next) => patchRow(row.localId, next)}
              onOpenComposer={openComposer}
              onRemove={() => removeRow(row.localId)}
            />
          )
        })}

        {composer ? (
          <ContentsComposer
            composer={composer}
            isEmpty={false}
            takenProducts={takenProducts}
            takenPrototypes={takenPrototypes}
            preferL2NodeId={preferL2NodeId}
            onOpenIntent={openComposer}
            onCancel={cancelComposer}
            onCatalogPick={addCatalog}
            onPrototypePick={addPrototype}
          />
        ) : null}
      </div>

      {!composer && canAdd ? (
        <ContentsAddActions
          onOpen={openComposer}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 16,
          }}
        />
      ) : null}

      <ContentsFieldNotes
        composer={composer}
        rowCount={rows.length}
        canAdd={canAdd}
        overBy={overBy}
        missingUpcCount={missingUpcCount}
        unconfirmedCount={unconfirmedCount}
      />
    </>
  )
}
