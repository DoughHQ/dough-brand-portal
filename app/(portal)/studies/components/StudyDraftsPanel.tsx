'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteStudyDraftAction,
  renameStudyDraftAction,
  type StudyDraftListItem,
  type StudyDraftTestType,
} from '@/app/(portal)/studies/drafts/actions'
import { unbindByServerDraftId } from '@/lib/studies/draftServerBindings'
import { openServerStudyDraft } from '@/lib/studies/openServerDraft'
import StudyDraftRow from './drafts/StudyDraftRow'

type Props = {
  drafts: StudyDraftListItem[]
  effectiveBrandId: number
  onChange: (next: StudyDraftListItem[]) => void
  onError: (message: string) => void
  onToast: (message: string) => void
}

function asTestType(raw: string): StudyDraftTestType | null {
  if (raw === 'concept' || raw === 'ihut') return raw
  return null
}

/**
 * Server-persisted wizard drafts for the current brand scope.
 * Continue hydrates local cache + navigates to the matching builder edit URL.
 */
export default function StudyDraftsPanel({
  drafts,
  effectiveBrandId,
  onChange,
  onError,
  onToast,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const openDraft = useCallback(
    async (row: StudyDraftListItem) => {
      setBusyId(row.id)
      onError('')
      const result = await openServerStudyDraft({
        serverDraftId: row.id,
        effectiveBrandId,
      })
      setBusyId(null)
      if (!result.ok) {
        onError(result.error)
        return
      }
      startTransition(() => {
        router.push(result.href)
      })
    },
    [effectiveBrandId, onError, router]
  )

  const deleteDraft = useCallback(
    async (row: StudyDraftListItem) => {
      setBusyId(row.id)
      onError('')
      const result = await deleteStudyDraftAction(row.id)
      setBusyId(null)
      if (!result.ok) {
        onError(result.error)
        return
      }
      unbindByServerDraftId(row.id)
      onChange(drafts.filter((d) => d.id !== row.id))
      onToast('Draft deleted')
    },
    [drafts, onChange, onError, onToast]
  )

  const startRename = useCallback((row: StudyDraftListItem) => {
    setRenamingId(row.id)
    setRenameValue(row.title?.trim() || '')
  }, [])

  const cancelRename = useCallback(() => {
    setRenamingId(null)
    setRenameValue('')
  }, [])

  const saveRename = useCallback(
    async (row: StudyDraftListItem) => {
      const testType = asTestType(row.test_type)
      if (!testType) {
        onError('Unknown study type.')
        return
      }
      setBusyId(row.id)
      onError('')
      const result = await renameStudyDraftAction({
        draftId: row.id,
        testType,
        title: renameValue,
      })
      setBusyId(null)
      if (!result.ok) {
        onError(result.error)
        return
      }
      const nextTitle = renameValue.trim()
      onChange(
        drafts.map((d) =>
          d.id === row.id
            ? { ...d, title: nextTitle, updated_at: new Date().toISOString() }
            : d
        )
      )
      setRenamingId(null)
      setRenameValue('')
      onToast('Draft renamed')
    },
    [drafts, onChange, onError, onToast, renameValue]
  )

  if (drafts.length === 0) {
    return <p className="studies-empty-quiet">No drafts.</p>
  }

  return (
    <div className="studies-list">
      {drafts.map((row) => (
        <StudyDraftRow
          key={row.id}
          row={row}
          busy={busyId === row.id || pending}
          opening={busyId === row.id}
          renaming={renamingId === row.id}
          renameValue={renameValue}
          onRenameValue={setRenameValue}
          onSaveRename={() => void saveRename(row)}
          onCancelRename={cancelRename}
          onOpen={() => void openDraft(row)}
          onStartRename={() => startRename(row)}
          onDelete={() => void deleteDraft(row)}
        />
      ))}
    </div>
  )
}
