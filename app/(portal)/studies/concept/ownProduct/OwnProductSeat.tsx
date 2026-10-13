import type { Dispatch, KeyboardEvent, Ref, SetStateAction } from 'react'
import type { ConceptArmRow, PricePosture } from '@/lib/concept/types'
import { fieldCard } from '../conceptStyles'
import ConceptDesignCard from './ConceptDesignCard'
import OwnVariantCard from './OwnVariantCard'

type Props = {
  arm: ConceptArmRow
  index: number
  isLast: boolean
  singleTestMode: boolean
  priceMode: boolean
  multi: boolean
  dragArmId: string | null
  setDragArmId: Dispatch<SetStateAction<string | null>>
  reorder: (fromId: string, toId: string) => void
  nameFocusRef: Ref<HTMLInputElement>
  brandId: number
  draftId: string
  blindImageMode: boolean
  pricePosture: PricePosture
  modeLabel: string
  disabled?: boolean
  onPatch: (patch: Partial<ConceptArmRow>) => void
  onNameKeyDown: (e: KeyboardEvent, isLast: boolean) => void
  onRemove: () => void
}

export default function OwnProductSeat({
  arm,
  index,
  isLast,
  singleTestMode,
  priceMode,
  multi,
  dragArmId,
  setDragArmId,
  reorder,
  nameFocusRef,
  brandId,
  draftId,
  blindImageMode,
  pricePosture,
  modeLabel,
  disabled,
  onPatch,
  onNameKeyDown,
  onRemove,
}: Props) {
  return (
    <div
      id={`field-seat-arm-${arm.localId}`}
      draggable={multi && !priceMode}
      onDragStart={() => setDragArmId(arm.localId)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        if (dragArmId) reorder(dragArmId, arm.localId)
        setDragArmId(null)
      }}
      className={singleTestMode ? 'cb-concept-card' : undefined}
      style={
        singleTestMode
          ? { cursor: multi && !priceMode ? 'grab' : 'default' }
          : {
              ...fieldCard,
              cursor: multi && !priceMode ? 'grab' : 'default',
            }
      }
    >
      {singleTestMode ? (
        <ConceptDesignCard
          arm={arm}
          index={index}
          isLast={isLast}
          nameFocusRef={isLast ? nameFocusRef : undefined}
          brandId={brandId}
          draftId={draftId}
          blindImageMode={blindImageMode}
          disabled={disabled}
          onPatch={onPatch}
          onNameKeyDown={(e) => onNameKeyDown(e, isLast)}
          onRemove={multi ? onRemove : undefined}
        />
      ) : (
        <OwnVariantCard
          arm={arm}
          index={index}
          isLast={isLast}
          nameFocusRef={isLast ? nameFocusRef : undefined}
          brandId={brandId}
          draftId={draftId}
          blindImageMode={blindImageMode}
          pricePosture={pricePosture}
          modeLabel={modeLabel}
          priceMode={priceMode}
          multi={multi}
          singleTestMode={singleTestMode}
          disabled={disabled}
          onPatch={onPatch}
          onNameKeyDown={(e) => onNameKeyDown(e, isLast)}
          onRemove={onRemove}
        />
      )}
    </div>
  )
}
