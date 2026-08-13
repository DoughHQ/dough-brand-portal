'use client'

import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { createClient } from '@/lib/supabase'
import {
  resolveStimuliPreviewUrl,
  uploadConceptStimulus,
} from '@/lib/concept/stimuliStorage'
import { ghostLink, labelSm } from './conceptStyles'

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
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dragDepth = useRef(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const loadPreview = useCallback(async () => {
    if (!imageUrl) {
      setPreviewUrl(null)
      setPreviewLoading(false)
      return
    }
    setPreviewLoading(true)
    const supabase = createClient()
    const url = await resolveStimuliPreviewUrl(supabase, imageUrl)
    setPreviewUrl(url)
    setPreviewLoading(false)
  }, [imageUrl])

  useEffect(() => {
    void loadPreview()
  }, [loadPreview])

  async function handleFile(file: File | null | undefined) {
    if (!file || disabled || uploading) return
    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const result = await uploadConceptStimulus(supabase, {
        brandId,
        draftId,
        armLabel,
        file,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      onChange({
        image_url: result.storageRef,
        image_filename: result.filename,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = 0
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    void handleFile(file)
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled || uploading) return
    dragDepth.current += 1
    setDragOver(true)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragOver(false)
  }

  const filled = !!imageUrl
  const displayName = imageFilename || leafName(imageUrl) || 'Pack image'
  const hero = variant === 'hero'

  return (
    <div>
      <style>{`@keyframes concept-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={labelSm}>
        Pack image{requiredHint ? ' · Required' : ''}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        disabled={disabled || uploading}
        onChange={(e) => void handleFile(e.target.files?.[0])}
        style={{ display: 'none' }}
      />

      {!filled ? (
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
                  gap: 12,
                  minHeight: 172,
                  boxSizing: 'border-box',
                  border: dragOver
                    ? '1px solid var(--cb-sage)'
                    : 'var(--cb-border-dashed)',
                  borderRadius: 'var(--cb-radius-card)',
                  background: dragOver
                    ? 'var(--cb-sage-hover)'
                    : 'var(--cb-surface-muted)',
                  padding: '32px 24px',
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
                  background: dragOver ? 'var(--cb-sage-hover)' : 'var(--white)',
                  padding: 12,
                  cursor: disabled || uploading ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.55 : 1,
                  transition: 'border-color 120ms ease, background 120ms ease',
                }
          }
        >
          <DropGlyph active={dragOver || uploading} large={hero} />
          <div style={{ flex: hero ? undefined : 1, minWidth: 0 }}>
            {uploading ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                Uploading…
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontSize: hero ? 15 : 13,
                    fontWeight: 600,
                    color: 'var(--ink-80)',
                  }}
                >
                  {hero ? 'Upload pack image' : 'Choose a file or drag it here'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-50)',
                    marginTop: 4,
                  }}
                >
                  PNG, JPG, or WebP · under 15 MB
                </div>
              </>
            )}
          </div>
          {uploading && !hero ? <Spinner /> : null}
        </label>
      ) : (
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
              background: 'var(--white)',
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
              onClick={() => {
                setError(null)
                setPreviewUrl(null)
                onChange({ image_url: null, image_filename: null })
              }}
              style={{ ...ghostLink, color: 'var(--ink-50)' }}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

function leafName(ref: string | null): string | null {
  if (!ref) return null
  const path = ref.includes('/') ? ref.split('/').pop() : ref
  return path || null
}

function DropGlyph({ active, large }: { active: boolean; large?: boolean }) {
  const size = large ? 52 : 36
  const icon = large ? 24 : 18
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: large ? 'var(--cb-radius-pill)' : 'var(--cb-radius-media)',
        background: active ? 'var(--cb-sage-soft)' : 'var(--cb-sage-hover)',
        color: 'var(--cb-sage)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 120ms ease, color 120ms ease',
      }}
    >
      <svg width={icon} height={icon} viewBox="0 0 18 18" fill="none">
        <path
          d="M9 12.5V3.5M9 3.5L5.5 7M9 3.5L12.5 7M3.5 12.5v1a1.5 1.5 0 001.5 1.5h8a1.5 1.5 0 001.5-1.5v-1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        width: 16,
        height: 16,
        borderRadius: 'var(--cb-radius-pill)',
        border: '2px solid var(--ink-10)',
        borderTopColor: 'var(--cb-sage)',
        animation: 'concept-spin 0.7s linear infinite',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}
