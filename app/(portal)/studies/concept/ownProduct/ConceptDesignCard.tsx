import type { KeyboardEvent, Ref } from 'react'
import type { ConceptArmRow } from '@/lib/concept/types'
import { respondentDesignLabel } from '@/lib/concept/designLetters'
import ConceptArmImageUploader from '../ConceptArmImageUploader'
import { TrashIcon } from '../fieldIcons'
import { inputBase, trashBtn } from '../conceptStyles'

export default function ConceptDesignCard({
  arm,
  index,
  isLast,
  nameFocusRef,
  brandId,
  draftId,
  blindImageMode,
  disabled,
  onPatch,
  onNameKeyDown,
  onRemove,
}: {
  arm: ConceptArmRow
  index: number
  isLast: boolean
  nameFocusRef?: Ref<HTMLInputElement>
  brandId: number
  draftId: string
  blindImageMode: boolean
  disabled?: boolean
  onPatch: (patch: Partial<ConceptArmRow>) => void
  onNameKeyDown: (e: KeyboardEvent) => void
  onRemove?: () => void
}) {
  const letter = respondentDesignLabel(index)
  return (
    <>
      <div className="cb-concept-card-top">
        <span className="cb-concept-letter">{letter}</span>
        {onRemove ? (
          <button type="button" aria-label={`Remove ${letter}`} onClick={onRemove} style={trashBtn}>
            <TrashIcon />
          </button>
        ) : null}
      </div>
      <div className="cb-concept-card-body">
        <ConceptArmImageUploader
          brandId={brandId}
          draftId={draftId}
          armLabel={arm.arm_label}
          imageUrl={arm.image_url}
          imageFilename={arm.image_filename}
          requiredHint={blindImageMode}
          variant="hero"
          disabled={disabled}
          onChange={({ image_url, image_filename }) => onPatch({ image_url, image_filename })}
        />
        <input
          id={`arm-name-${arm.localId}`}
          className="cb-input cb-concept-name"
          aria-label="Name this design"
          ref={isLast ? nameFocusRef : undefined}
          value={arm.display_name}
          onChange={(e) => onPatch({ display_name: e.target.value })}
          onKeyDown={onNameKeyDown}
          placeholder="Name this design"
          style={inputBase}
        />
      </div>
    </>
  )
}
