import type { DragEvent } from 'react'
import DropGlyph from './DropGlyph'
import Spinner from './Spinner'

export default function EmptyDropZone({
  hero,
  inputId,
  dragOver,
  uploading,
  disabled,
  onDrop,
  onDragEnter,
  onDragOver,
  onDragLeave,
}: {
  hero: boolean
  inputId: string
  dragOver: boolean
  uploading: boolean
  disabled?: boolean
  onDrop: (e: DragEvent) => void
  onDragEnter: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
}) {
  return (
    <label
      htmlFor={inputId}
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={
        hero
          ? {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: 72,
              boxSizing: 'border-box',
              border: dragOver
                ? '1px solid var(--cb-sage)'
                : 'var(--cb-border-dashed)',
              borderRadius: 10,
              background: dragOver
                ? 'var(--cb-sage-hover)'
                : 'var(--cb-surface-muted)',
              padding: '10px 8px',
              cursor: disabled || uploading ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.55 : 1,
              transition: 'border-color 120ms ease, background 120ms ease',
              textAlign: 'center',
            }
          : {
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 52,
              boxSizing: 'border-box',
              border: dragOver
                ? '1px solid var(--cb-sage)'
                : 'var(--cb-border-dashed)',
              borderRadius: 'var(--r-sm)',
              background: dragOver ? 'var(--cb-sage-hover)' : 'var(--paper)',
              padding: 12,
              cursor: disabled || uploading ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.55 : 1,
              transition: 'border-color 120ms ease, background 120ms ease',
            }
      }
    >
      <DropGlyph active={dragOver || uploading} large={false} />
      <div style={{ flex: hero ? undefined : 1, minWidth: 0 }}>
        {uploading ? (
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            Uploading…
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink-80)',
              }}
            >
              {hero ? 'Add pack image' : 'Choose a file or drag it here'}
            </div>
            {!hero ? (
            <div
              style={{
                fontSize: 12,
                color: 'var(--ink-50)',
                marginTop: 4,
              }}
            >
              PNG, JPG, or WebP · under 15 MB
            </div>
            ) : null}
          </>
        )}
      </div>
      {uploading && !hero ? <Spinner /> : null}
    </label>
  )
}
