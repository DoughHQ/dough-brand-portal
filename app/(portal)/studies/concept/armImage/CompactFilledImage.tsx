import type { DragEvent, RefObject } from 'react'
import { ghostLink } from '../conceptStyles'
import Spinner from './Spinner'

export default function CompactFilledImage({
  dragOver,
  uploading,
  previewLoading,
  previewUrl,
  loadPreview,
  disabled,
  displayName,
  inputRef,
  onClear,
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
  displayName: string
  inputRef: RefObject<HTMLInputElement | null>
  onClear: () => void
  onDrop: (e: DragEvent) => void
  onDragEnter: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
}) {
  return (
    <div
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
        boxSizing: 'border-box',
        border: dragOver
          ? '1px solid var(--cb-sage)'
          : '1px solid var(--ink-10)',
        borderRadius: 'var(--r-sm)',
        background: dragOver ? 'var(--cb-sage-hover)' : 'var(--surface-1)',
        padding: '8px 12px',
        opacity: disabled ? 0.55 : 1,
        transition: 'border-color 120ms ease, background 120ms ease',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--cb-radius-media)',
          background: 'var(--paper)',
          border: '1px solid var(--ink-10)',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {uploading || previewLoading ? (
          <Spinner />
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed storage preview
          <img
            src={previewUrl}
            alt=""
            onError={() => void loadPreview()}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : (
          <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>—</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={displayName}
        >
          {uploading ? 'Replacing…' : displayName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-50)', marginTop: 4 }}>
          {dragOver ? 'Drop to replace' : 'Ready for the study'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          style={ghostLink}
        >
          Replace
        </button>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={onClear}
          style={{ ...ghostLink, color: 'var(--ink-50)' }}
        >
          Remove
        </button>
      </div>
    </div>
  )
}
