'use client'

import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { createClient } from '@/lib/supabase'
import {
  resolveStimuliPreviewUrl,
  uploadConceptStimulus,
} from '@/lib/concept/stimuliStorage'

export function useConceptArmImage({
  brandId,
  draftId,
  armLabel,
  imageUrl,
  imageFilename,
  variant = 'compact',
  disabled,
  onChange,
}: {
  brandId: number
  draftId: string
  armLabel: string
  imageUrl: string | null
  imageFilename: string | null
  variant?: 'compact' | 'hero'
  disabled?: boolean
  onChange: (next: { image_url: string | null; image_filename: string | null }) => void
}) {
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

  function clearImage() {
    setError(null)
    setPreviewUrl(null)
    onChange({ image_url: null, image_filename: null })
  }

  const filled = !!imageUrl
  const displayName = imageFilename || leafName(imageUrl) || 'Pack image'
  const hero = variant === 'hero'

  return {
    inputId,
    inputRef,
    dragOver,
    uploading,
    error,
    previewUrl,
    previewLoading,
    loadPreview,
    handleFile,
    onDrop,
    onDragEnter,
    onDragOver,
    onDragLeave,
    clearImage,
    filled,
    displayName,
    hero,
  }
}

function leafName(ref: string | null): string | null {
  if (!ref) return null
  const path = ref.includes('/') ? ref.split('/').pop() : ref
  return path || null
}
