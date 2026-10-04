'use client'

import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { createClient } from '@/lib/supabase'
import {
  MAX_PROTOTYPE_IMAGES,
  resolvePrototypePreviewUrl,
  uploadPrototypeImage,
} from '@/lib/prototypes/storage'

type Props = {
  brandId: number
  imagePaths: string[]
  disabled?: boolean
  onChange: (paths: string[]) => void
}

function Thumb({
  path,
  onRemove,
  disabled,
}: {
  path: string
  onRemove: () => void
  disabled?: boolean
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    void resolvePrototypePreviewUrl(supabase, path).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  return (
    <div className="proto-thumb">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="proto-thumb-img" />
      ) : (
        <div className="proto-thumb-placeholder" />
      )}
      {!disabled ? (
        <button type="button" className="proto-thumb-remove" onClick={onRemove} aria-label="Remove photo">
          ×
        </button>
      ) : null}
    </div>
  )
}

export default function PrototypeImageUploader({ brandId, imagePaths, disabled, onChange }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dragDepth = useRef(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = MAX_PROTOTYPE_IMAGES - imagePaths.length
  const canAdd = !disabled && remaining > 0 && !uploading

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canAdd) return
      const list = Array.from(files).slice(0, remaining)
      if (list.length === 0) return
      setUploading(true)
      setError(null)
      const supabase = createClient()
      const next = [...imagePaths]
      for (const file of list) {
        if (next.length >= MAX_PROTOTYPE_IMAGES) break
        const result = await uploadPrototypeImage(supabase, { brandId, file })
        if (!result.ok) {
          setError(result.error)
          break
        }
        next.push(result.storageRef)
      }
      onChange(next)
      setUploading(false)
    },
    [brandId, canAdd, imagePaths, onChange, remaining]
  )

  function onDrop(e: DragEvent) {
    e.preventDefault()
    dragDepth.current = 0
    setDragOver(false)
    if (!canAdd) return
    void addFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div className="proto-thumbs">
        {imagePaths.map((path) => (
          <Thumb
            key={path}
            path={path}
            disabled={disabled}
            onRemove={() => onChange(imagePaths.filter((p) => p !== path))}
          />
        ))}
        {canAdd ? (
          <label
            htmlFor={inputId}
            className={`proto-drop${dragOver ? ' proto-drop-active' : ''}${uploading ? ' proto-drop-busy' : ''}`}
            onDragEnter={(e) => {
              e.preventDefault()
              dragDepth.current += 1
              setDragOver(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              dragDepth.current -= 1
              if (dragDepth.current <= 0) {
                dragDepth.current = 0
                setDragOver(false)
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic"
              multiple
              hidden
              disabled={!canAdd}
              onChange={(e) => {
                const files = e.target.files
                if (files) void addFiles(files)
                e.target.value = ''
              }}
            />
            <span className="proto-drop-label">{uploading ? 'Uploading…' : 'Add photos'}</span>
            <span className="proto-drop-hint">JPEG · PNG · WebP · HEIC · up to 15 MB</span>
          </label>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="proto-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
