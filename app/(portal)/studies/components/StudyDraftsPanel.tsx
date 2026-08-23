'use client'

import { useCallback, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteStudyDraftAction,
  renameStudyDraftAction,
  type StudyDraftListItem,
  type StudyDraftTestType,
} from '@/app/(portal)/studies/drafts/actions'
import { unbindByServerDraftId } from '@/lib/studies/draftServerBindings'
import { openServerStudyDraft } from '@/lib/studies/openServerDraft'
import { formatResumeWhen } from '@/lib/studies/useServerStudyDraft'

type Props = {
  drafts: StudyDraftListItem[]
  effectiveBrandId: number
  onChange: (next: StudyDraftListItem[]) => void
  onError: (message: string) => void
  onToast: (message: string) => void
}

function typeLabel(testType: string): string {
  if (testType === 'concept') return 'Concept'
  if (testType === 'ihut') return 'iHUT'
  return 'Study'
}

function asTestType(raw: string): StudyDraftTestType | null {
  if (raw === 'concept' || raw === 'ihut') return raw
  return null
}

/**
 * Server-persisted wizard drafts for the current brand scope.
 * Open hydrates local cache + navigates to the matching builder edit URL.
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

  if (drafts.length === 0) return null

  return (
    <section style={{ marginBottom: 28 }} aria-label="Saved drafts">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 400,
            color: 'var(--sage-dark)',
            margin: 0,
          }}
        >
          Drafts
        </h2>
        <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>
          {drafts.length} saved · sync across devices
        </span>
      </div>

      <div
        style={{
          background: 'var(--paper, var(--white))',
          border: '1px solid var(--mist, var(--ink-10))',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {drafts.map((row, i) => {
          const busy = busyId === row.id || pending
          const renaming = renamingId === row.id
          return (
            <div
              key={row.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '14px 18px',
                borderBottom:
                  i < drafts.length - 1 ? '1px solid var(--mist, var(--ink-10))' : 'none',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                {renaming ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void saveRename(row)
                    }}
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      disabled={busy}
                      aria-label="Draft title"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: 'var(--font-sans)',
                        fontSize: 14,
                        fontWeight: 500,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--mist, var(--ink-10))',
                        color: 'var(--ink)',
                        background: 'var(--cream, var(--surface))',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={busy || !renameValue.trim()}
                      style={quietPrimary}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={cancelRename}
                      style={quietGhost}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 4,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.title?.trim() || 'Untitled study'}
                      </span>
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: 8,
                          color: 'var(--ink-50)',
                          background: 'var(--surface-1, var(--cream))',
                        }}
                      >
                        {typeLabel(row.test_type)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>
                      Updated {formatResumeWhen(row.updated_at)}
                    </div>
                  </>
                )}
              </div>

              {!renaming ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startRename(row)}
                    style={quietGhost}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        typeof window !== 'undefined' &&
                        !window.confirm(
                          `Delete “${row.title?.trim() || 'Untitled study'}”? This can’t be undone.`
                        )
                      ) {
                        return
                      }
                      void deleteDraft(row)
                    }}
                    style={{ ...quietGhost, color: 'var(--coral, #c45c4a)' }}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void openDraft(row)}
                    style={quietPrimary}
                  >
                    {busyId === row.id ? 'Opening…' : 'Open'}
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

const quietGhost: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-50)',
  padding: '8px 10px',
}

const quietPrimary: CSSProperties = {
  border: 'none',
  background: 'var(--sage)',
  color: 'var(--white, #fff)',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 600,
  padding: '9px 14px',
  borderRadius: 8,
}
