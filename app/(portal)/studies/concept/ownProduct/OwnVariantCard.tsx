import type { KeyboardEvent, Ref } from 'react'
import type { ConceptArmRow, PricePosture } from '@/lib/concept/types'
import { armLabelForIndex } from '@/lib/concept/defaults'
import { isAllowedPriceInput } from '@/lib/concept/price'
import { respondentDesignLabel } from '@/lib/concept/designLetters'
import ConceptArmImageUploader from '../ConceptArmImageUploader'
import { DragHandle, TrashIcon } from '../fieldIcons'
import { inputBase, labelSm, sectionEyebrow, trashBtn } from '../conceptStyles'

export default function OwnVariantCard({
  arm,
  index,
  isLast,
  nameFocusRef,
  brandId,
  draftId,
  blindImageMode,
  pricePosture,
  modeLabel,
  priceMode,
  multi,
  singleTestMode,
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
  pricePosture: PricePosture
  modeLabel: string
  priceMode: boolean
  multi: boolean
  singleTestMode: boolean
  disabled?: boolean
  onPatch: (patch: Partial<ConceptArmRow>) => void
  onNameKeyDown: (e: KeyboardEvent) => void
  onRemove?: () => void
}) {
  const label = arm.arm_label || armLabelForIndex(index)
  const name = arm.display_name.trim()
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {multi && !priceMode ? <DragHandle /> : null}
        <span className="cb-own-badge">Own product</span>
        {singleTestMode ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--sage)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Respondents see: {respondentDesignLabel(index)}
          </span>
        ) : multi ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--ink-50)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Variant {label}
          </span>
        ) : null}
        <div style={{ flex: 1 }} />
        {multi ? (
          <button
            type="button"
            aria-label={`Remove variant ${label}`}
            onClick={onRemove}
            style={trashBtn}
          >
            <TrashIcon />
          </button>
        ) : null}
      </div>

      {/* what object am I configuring? */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-80)' }}>
          {name || 'New product concept'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 4 }}>
          {multi ? `Variant ${label} of your product` : 'Your product in this study'}
        </div>
      </div>

      {/* 1 · identity */}
      <label style={labelSm} htmlFor={`arm-name-${arm.localId}`}>
        Product name
      </label>
      <input
        id={`arm-name-${arm.localId}`}
        className="cb-input"
        ref={isLast ? nameFocusRef : undefined}
        value={arm.display_name}
        onChange={(e) => onPatch({ display_name: e.target.value })}
        onKeyDown={onNameKeyDown}
        placeholder="e.g. Midnight Cocoa — matte black"
        style={{ ...inputBase, marginBottom: 24 }}
      />

      {/* 2 · the thing respondents actually evaluate */}
      <ConceptArmImageUploader
        brandId={brandId}
        draftId={draftId}
        armLabel={label}
        imageUrl={arm.image_url}
        imageFilename={arm.image_filename}
        requiredHint={blindImageMode}
        variant="hero"
        disabled={disabled}
        onChange={({ image_url, image_filename }) =>
          onPatch({ image_url, image_filename })
        }
      />

      {/* 3 · study-controlled context — read-only, not a task */}
      <div style={{ marginTop: 24 }}>
        <div style={sectionEyebrow}>Study format</div>
        <div style={{ fontSize: 13, color: 'var(--ink)' }}>
          {modeLabel}
          {blindImageMode ? ' · shown blind to respondents' : ''}
        </div>
      </div>

      {/* 4 · study-specific settings, only where they apply */}
      {!blindImageMode ? (
        <div style={{ marginTop: 24 }}>
          <label style={labelSm} htmlFor={`arm-price-${arm.localId}`}>
            Price
          </label>
          <input
            id={`arm-price-${arm.localId}`}
            className="cb-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={arm.frozen_price ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              if (!isAllowedPriceInput(raw)) return
              onPatch({
                frozen_price: raw.trim() === '' ? null : raw,
              })
            }}
            onKeyDown={onNameKeyDown}
            placeholder={pricePosture === 'blind' ? '—' : '4.99'}
            style={inputBase}
          />
        </div>
      ) : null}
    </>
  )
}
