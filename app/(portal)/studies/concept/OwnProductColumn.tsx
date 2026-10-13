'use client'

import type { ConceptArmRow, PricePosture } from '@/lib/concept/types'
import type { AddAvailability } from '@/lib/concept/fieldSize'
import OwnProductAddControl from './ownProduct/OwnProductAddControl'
import OwnProductColumnHead from './ownProduct/OwnProductColumnHead'
import OwnProductEmptyState from './ownProduct/OwnProductEmptyState'
import OwnProductSeat from './ownProduct/OwnProductSeat'
import { useOwnProductColumn } from './ownProduct/useOwnProductColumn'

type Props = {
  arms: ConceptArmRow[]
  onArmsChange: (next: ConceptArmRow[]) => void
  brandId: number
  draftId: string
  /** Standalone price study — exactly one own product, no variants. */
  priceMode: boolean
  /** Packaging / price — pack image required, prices forced blind. */
  blindImageMode: boolean
  pricePosture: PricePosture
  modeLabel: string
  /** Authoritative field-capacity verdict — owned by lib/concept/fieldSize. */
  addVariant: AddAvailability
  disabled?: boolean
  /** Single-test — Design letters by field position. */
  singleTestMode?: boolean
}

export default function OwnProductColumn({
  arms,
  onArmsChange,
  brandId,
  draftId,
  priceMode,
  blindImageMode,
  pricePosture,
  modeLabel,
  addVariant: addVariantAvailability,
  disabled,
  singleTestMode = false,
}: Props) {
  const column = useOwnProductColumn({
    arms,
    onArmsChange,
    priceMode,
    addVariant: addVariantAvailability,
    disabled,
  })

  return (
    <>
      <OwnProductColumnHead singleTestMode={singleTestMode} priceMode={priceMode} />

      <div className="cb-field-body-left">
        {column.showEmptyState ? (
          <OwnProductEmptyState onStart={column.startSetup} disabled={disabled} />
        ) : null}

        {!column.showEmptyState
          ? arms.map((arm, index) => (
              <OwnProductSeat
                key={arm.localId}
                arm={arm}
                index={index}
                isLast={index === arms.length - 1}
                singleTestMode={singleTestMode}
                priceMode={priceMode}
                multi={column.multi}
                dragArmId={column.dragArmId}
                setDragArmId={column.setDragArmId}
                reorder={column.reorder}
                nameFocusRef={column.nameFocusRef}
                brandId={brandId}
                draftId={draftId}
                blindImageMode={blindImageMode}
                pricePosture={pricePosture}
                modeLabel={modeLabel}
                disabled={disabled}
                onPatch={(patch) => column.patchArm(arm.localId, patch)}
                onNameKeyDown={column.onNameKeyDown}
                onRemove={() => column.removeVariant(arm.localId)}
              />
            ))
          : null}

        {!column.showEmptyState && !priceMode ? (
          <OwnProductAddControl
            singleTestMode={singleTestMode}
            disabled={disabled}
            addVariant={addVariantAvailability}
            onAdd={column.addVariant}
          />
        ) : null}
      </div>
    </>
  )
}
