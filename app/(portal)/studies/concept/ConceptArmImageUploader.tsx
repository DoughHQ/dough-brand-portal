'use client'

import { labelSm } from './conceptStyles'
import CompactFilledImage from './armImage/CompactFilledImage'
import EmptyDropZone from './armImage/EmptyDropZone'
import HeroImageStage from './armImage/HeroImageStage'
import { useConceptArmImage } from './armImage/useConceptArmImage'

type Props = {
  brandId: number
  draftId: string
  armLabel: string
  imageUrl: string | null
  imageFilename: string | null
  requiredHint?: boolean
  /** Large dashed drop zone — used in Field “Your product” panel. */
  variant?: 'compact' | 'hero'
  disabled?: boolean
  onChange: (next: { image_url: string | null; image_filename: string | null }) => void
}

export default function ConceptArmImageUploader({
  brandId,
  draftId,
  armLabel,
  imageUrl,
  imageFilename,
  requiredHint,
  variant = 'compact',
  disabled,
  onChange,
}: Props) {
  const image = useConceptArmImage({
    brandId,
    draftId,
    armLabel,
    imageUrl,
    imageFilename,
    variant,
    disabled,
    onChange,
  })

  return (
    <div>
      <style>{`@keyframes concept-spin{to{transform:rotate(360deg)}}`}</style>
      {image.hero ? null : (
        <div style={labelSm}>
          Pack image{requiredHint ? ' · Required' : ''}
        </div>
      )}

      <input
        ref={image.inputRef}
        id={image.inputId}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        disabled={disabled || image.uploading}
        onChange={(e) => void image.handleFile(e.target.files?.[0])}
        style={{ display: 'none' }}
      />

      {!image.filled ? (
        <EmptyDropZone
          hero={image.hero}
          inputId={image.inputId}
          dragOver={image.dragOver}
          uploading={image.uploading}
          disabled={disabled}
          onDrop={image.onDrop}
          onDragEnter={image.onDragEnter}
          onDragOver={image.onDragOver}
          onDragLeave={image.onDragLeave}
        />
      ) : image.hero ? (
        <HeroImageStage
          dragOver={image.dragOver}
          uploading={image.uploading}
          previewLoading={image.previewLoading}
          previewUrl={image.previewUrl}
          loadPreview={image.loadPreview}
          disabled={disabled}
          inputRef={image.inputRef}
          onDrop={image.onDrop}
          onDragEnter={image.onDragEnter}
          onDragOver={image.onDragOver}
          onDragLeave={image.onDragLeave}
        />
      ) : (
        <CompactFilledImage
          dragOver={image.dragOver}
          uploading={image.uploading}
          previewLoading={image.previewLoading}
          previewUrl={image.previewUrl}
          loadPreview={image.loadPreview}
          disabled={disabled}
          displayName={image.displayName}
          inputRef={image.inputRef}
          onClear={image.clearImage}
          onDrop={image.onDrop}
          onDragEnter={image.onDragEnter}
          onDragOver={image.onDragOver}
          onDragLeave={image.onDragLeave}
        />
      )}

      {image.error ? (
        <p role="alert" style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red)' }}>
          {image.error}
        </p>
      ) : null}
    </div>
  )
}
