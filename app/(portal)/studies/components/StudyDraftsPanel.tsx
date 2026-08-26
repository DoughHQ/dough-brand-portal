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
import RowOverflowMenu from './RowOverflowMenu'
import { ICON_FILE, StudiesGlyph } from './studiesIcons'

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
      {drafts.map((row) => {
        const busy = busyId === row.id || pending
        const renaming = renamingId === row.id
        return (
          <div key={row.id} className="studies-study-row studies-study-row--draft">
            {renaming ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void saveRename(row)
                }}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 0,
                }}
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
                <div className="studies-study-main">
                  <div className="studies-study-mark studies-study-mark-neutral">
                    <StudiesGlyph d={ICON_FILE} size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="studies-study-name">
                      {row.title?.trim() || 'Untitled study'}
                    </div>
                    <div className="studies-study-meta">
                      <span className="studies-type-badge">{typeLabel(row.test_type)}</span>
                      <span className="studies-study-sub">
                        Updated {formatResumeWhen(row.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="studies-study-actions">
                  <button
                    type="button"
                    className="studies-row-cta"
                    disabled={busy}
                    onClick={() => void openDraft(row)}
                  >
                    {busyId === row.id ? 'Opening…' : 'Continue →'}
                  </button>
                  <RowOverflowMenu
                    actions={[
                      {
                        label: 'Rename',
                        disabled: busy,
                        onClick: () => startRename(row),
                      },
                      {
                        label: 'Delete',
                        tone: 'danger',
                        disabled: busy,
                        onClick: () => {
                          if (
                            typeof window !== 'undefined' &&
                            !window.confirm(
                              `Delete “${row.title?.trim() || 'Untitled study'}”? This can’t be undone.`
                            )
                          ) {
                            return
                          }
                          void deleteDraft(row)
                        },
                      },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
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
