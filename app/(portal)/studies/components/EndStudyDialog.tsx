'use client'

import { useEffect, useState, useTransition } from 'react'
import ConfirmDialog from '../ConfirmDialog'
import {
  endStudyAction,
  getStudyEndPreviewAction,
} from '../endStudyActions'
import {
  endStudyDialogLines,
  endStudySuccessToast,
  type EndStudyResult,
  type StudyEndPreview,
} from '@/lib/studies/endStudy'

type Props = {
  open: boolean
  missionId: string | null
  title: string
  onCancel: () => void
  onFinished: (result: EndStudyResult) => void
  onError: (message: string) => void
}

export default function EndStudyDialog({
  open,
  missionId,
  title,
  onCancel,
  onFinished,
  onError,
}: Props) {
  const [preview, setPreview] = useState<StudyEndPreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open || !missionId) {
      setPreview(null)
      setLoadError(null)
      setLoadingPreview(false)
      return
    }
    let cancelled = false
    setLoadingPreview(true)
    setPreview(null)
    setLoadError(null)
    void getStudyEndPreviewAction(missionId).then((result) => {
      if (cancelled) return
      setLoadingPreview(false)
      if (!result.ok) {
        setLoadError(result.error)
        return
      }
      setPreview(result.preview)
    })
    return () => {
      cancelled = true
    }
  }, [open, missionId])

  const model =
    preview != null
      ? endStudyDialogLines(preview, title)
      : {
          title: `End “${title}”?`,
          loading: true,
          lines: [] as string[],
          canConfirm: false,
          confirmLabel: 'End study',
          cancelLabel: loadingPreview ? 'Cancel' : 'Close',
          blockedReason: loadError,
        }

  const body = loadingPreview ? (
    <p style={{ margin: 0 }}>Checking where this study stands…</p>
  ) : loadError ? (
    <p style={{ margin: 0 }}>{loadError}</p>
  ) : model.blockedReason ? (
    <p style={{ margin: 0 }}>{model.blockedReason}</p>
  ) : (
    <div style={{ display: 'grid', gap: 10 }}>
      {model.lines.map((line) => (
        <p key={line} style={{ margin: 0 }}>
          {line}
        </p>
      ))}
    </div>
  )

  return (
    <ConfirmDialog
      open={open}
      title={model.title}
      body={body}
      confirmLabel={model.confirmLabel}
      cancelLabel={model.blockedReason || loadError ? 'Close' : model.cancelLabel}
      tone="destructive"
      busy={pending || loadingPreview}
      hideConfirm={!model.canConfirm || loadingPreview || loadError != null}
      onCancel={onCancel}
      onConfirm={() => {
        if (!missionId || !model.canConfirm) return
        startTransition(async () => {
          const result = await endStudyAction(missionId)
          if (!result.ok) {
            onError(result.error)
            return
          }
          onFinished(result.result)
        })
      }}
    />
  )
}

export { endStudySuccessToast }
