'use client'

import type { ConceptArmRow, PricePosture } from '@/lib/concept/types'
import type { AddAvailability } from '@/lib/concept/fieldSize'
import { fieldCard } from './conceptStyles'
import ConceptDesignCard from './ownProduct/ConceptDesignCard'
import OwnProductEmptyState from './ownProduct/OwnProductEmptyState'
import OwnVariantCard from './ownProduct/OwnVariantCard'
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
      <div className="cb-field-head-left">
        <div className="cb-field-col-title">{singleTestMode ? 'Your concepts' : 'Your product'}</div>
        <div className="cb-field-col-meta">
          {singleTestMode
            ? 'The designs respondents will evaluate.'
            : priceMode
              ? 'The product or concept you want respondents to evaluate.'
              : 'Add the product or concept variants you want respondents to evaluate.'}
        </div>
      </div>

      <div className="cb-field-body-left">
        {column.showEmptyState ? (
          <OwnProductEmptyState onStart={column.startSetup} disabled={disabled} />
        ) : null}

        {!column.showEmptyState
          ? arms.map((arm, index) => {
              const isLast = index === arms.length - 1
              return (
                <div
                  key={arm.localId}
                  id={`field-seat-arm-${arm.localId}`}
                  draggable={column.multi && !priceMode}
                  onDragStart={() => column.setDragArmId(arm.localId)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (column.dragArmId) column.reorder(column.dragArmId, arm.localId)
                    column.setDragArmId(null)
                  }}
                  className={singleTestMode ? 'cb-concept-card' : undefined}
                  style={
                    singleTestMode
                      ? { cursor: column.multi && !priceMode ? 'grab' : 'default' }
                      : {
                          ...fieldCard,
                          cursor: column.multi && !priceMode ? 'grab' : 'default',
                        }
                  }
                >
                  {singleTestMode ? (
                    <ConceptDesignCard
                      arm={arm}
                      index={index}
                      isLast={isLast}
                      nameFocusRef={isLast ? column.nameFocusRef : undefined}
                      brandId={brandId}
                      draftId={draftId}
                      blindImageMode={blindImageMode}
                      disabled={disabled}
                      onPatch={(patch) => column.patchArm(arm.localId, patch)}
                      onNameKeyDown={(e) => column.onNameKeyDown(e, isLast)}
                      onRemove={column.multi ? () => column.removeVariant(arm.localId) : undefined}
                    />
                  ) : (
                    <OwnVariantCard
                      arm={arm}
                      index={index}
                      isLast={isLast}
                      nameFocusRef={isLast ? column.nameFocusRef : undefined}
                      brandId={brandId}
                      draftId={draftId}
                      blindImageMode={blindImageMode}
                      pricePosture={pricePosture}
                      modeLabel={modeLabel}
                      priceMode={priceMode}
                      multi={column.multi}
                      singleTestMode={singleTestMode}
                      disabled={disabled}
                      onPatch={(patch) => column.patchArm(arm.localId, patch)}
                      onNameKeyDown={(e) => column.onNameKeyDown(e, isLast)}
                      onRemove={() => column.removeVariant(arm.localId)}
                    />
                  )}
                </div>
              )
            })
          : null}

        {!column.showEmptyState && !priceMode ? (
          <>
            <button
              type="button"
              className={singleTestMode ? 'cb-concept-add' : 'cb-btn-outline'}
              onClick={column.addVariant}
              disabled={disabled || !addVariantAvailability.allowed}
              aria-describedby={
                addVariantAvailability.allowed ? undefined : 'cb-add-variant-reason'
              }
            >
              {singleTestMode ? '+ Add another concept' : '+ Add another variant'}
            </button>
            {!addVariantAvailability.allowed ? (
              <p
                id="cb-add-variant-reason"
                style={{
                  margin: '8px 0 0',
                  fontSize: 12,
                  color: 'var(--ink-50)',
                  lineHeight: 1.45,
                }}
              >
                {addVariantAvailability.message}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}
