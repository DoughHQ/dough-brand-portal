import type { DragEvent, RefObject } from 'react'
import Spinner from './Spinner'

export default function HeroImageStage({
  dragOver,
  uploading,
  previewLoading,
  previewUrl,
  loadPreview,
  disabled,
  inputRef,
  onDrop,
  onDragEnter,
  onDragOver,
  onDragLeave,
}: {
  dragOver: boolean
  uploading: boolean
  previewLoading: boolean
  previewUrl: string | null
  loadPreview: () => Promise<void>
  disabled?: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onDrop: (e: DragEvent) => void
  onDragEnter: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
}) {
  return (
    <div className="cb-concept-stage">
      <div
        className={`cb-concept-stage-frame${dragOver ? ' is-over' : ''}`}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {uploading || previewLoading ? (
          <Spinner />
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed storage preview
          <img src={previewUrl} alt="" onError={() => void loadPreview()} />
        ) : (
          <span className="cb-concept-stage-empty">Pack image</span>
        )}
        <button
          type="button"
          className="cb-concept-stage-replace"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Replacing…' : 'Replace'}
        </button>
      </div>
    </div>
  )
}
