'use client'

/**
 * Server-persisted study drafts — cross-device continuity.
 * Local draftId (client UUID) stays for edit URLs / local cache.
 * serverDraftId is the study_drafts row UUID from upsert_study_draft.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  deleteStudyDraftAction,
  getStudyDraftAction,
  listStudyDraftsAction,
  upsertStudyDraftAction,
  type StudyDraftListItem,
  type StudyDraftTestType,
} from '@/app/(portal)/studies/drafts/actions'
import {
  bindServerDraftId,
  getBoundServerDraftId,
  unbindServerDraftId,
} from '@/lib/studies/draftServerBindings'

const SAVE_DEBOUNCE_MS = 1200
const SAVED_IDLE_MS = 2500

export type ResumeOffer = {
  id: string
  title: string | null
  updatedAt: string
}

function relativeDraftTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatResumeWhen(iso: string): string {
  return relativeDraftTime(iso)
}

type Options<T> = {
  testType: StudyDraftTestType
  /** Only offer resume on fresh /new entry — not when editing a known local draft. */
  offerResume: boolean
  /** Current local wizard draftId — restores serverDraftId across /new → /edit remounts. */
  localDraftId: string
  getTitle: (draft: T) => string
  getLocalDraftId: (draft: T) => string
  /** Called when user accepts resume — hydrate wizard from server draft_json. */
  onHydrate: (draftJson: Record<string, unknown>, serverDraftId: string) => void
}

export function useServerStudyDraft<T extends object>({
  testType,
  offerResume,
  localDraftId,
  getTitle,
  getLocalDraftId,
  onHydrate,
}: Options<T>) {
  const [serverDraftId, setServerDraftId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? getBoundServerDraftId(localDraftId) : null
  )
  const [resumeOffer, setResumeOffer] = useState<ResumeOffer | null>(null)
  const [resumeBusy, setResumeBusy] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const serverDraftIdRef = useRef<string | null>(serverDraftId)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestDraftRef = useRef<T | null>(null)
  const localDraftIdRef = useRef(localDraftId)
  const allowSaveRef = useRef(!offerResume)
  const resumeResolvedRef = useRef(!offerResume)
  const onHydrateRef = useRef(onHydrate)
  onHydrateRef.current = onHydrate
  const getTitleRef = useRef(getTitle)
  getTitleRef.current = getTitle
  const getLocalDraftIdRef = useRef(getLocalDraftId)
  getLocalDraftIdRef.current = getLocalDraftId

  useEffect(() => {
    serverDraftIdRef.current = serverDraftId
  }, [serverDraftId])

  // Restore binding before paint so the first keystroke cannot mint a duplicate row.
  useLayoutEffect(() => {
    localDraftIdRef.current = localDraftId
    const bound = getBoundServerDraftId(localDraftId)
    if (bound && bound !== serverDraftIdRef.current) {
      serverDraftIdRef.current = bound
      setServerDraftId(bound)
    }
  }, [localDraftId])

  // Resume-most-recent on /new only.
  useEffect(() => {
    if (!offerResume) return
    let cancelled = false

    void (async () => {
      const result = await listStudyDraftsAction()
      if (cancelled) return
      if (!result.ok) {
        resumeResolvedRef.current = true
        allowSaveRef.current = true
        return
      }
      const match = result.drafts
        .filter((d: StudyDraftListItem) => d.test_type === testType)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0]
      if (match) {
        setResumeOffer({
          id: match.id,
          title: match.title,
          updatedAt: match.updated_at,
        })
      } else {
        resumeResolvedRef.current = true
        allowSaveRef.current = true
      }
    })()

    return () => {
      cancelled = true
    }
  }, [offerResume, testType])

  const flushSave = useCallback(
    async (draft: T) => {
      if (!allowSaveRef.current) return
      setSaveStatus('saving')
      if (savedIdleTimerRef.current) {
        clearTimeout(savedIdleTimerRef.current)
        savedIdleTimerRef.current = null
      }
      const title = getTitleRef.current(draft).trim() || null
      const localId = getLocalDraftIdRef.current(draft)
      const bound = localId ? getBoundServerDraftId(localId) : null
      const existingId = serverDraftIdRef.current ?? bound
      if (existingId && existingId !== serverDraftIdRef.current) {
        serverDraftIdRef.current = existingId
        setServerDraftId(existingId)
      }
      const result = await upsertStudyDraftAction({
        testType,
        title,
        draftJson: draft as unknown as Record<string, unknown>,
        draftId: existingId,
      })
      if (!result.ok) {
        console.warn('[study-draft] upsert failed:', result.error, result.hint)
        setSaveStatus('error')
        return
      }
      serverDraftIdRef.current = result.draft.id
      setServerDraftId(result.draft.id)
      if (localId) bindServerDraftId(localId, result.draft.id)
      setSaveStatus('saved')
      savedIdleTimerRef.current = setTimeout(() => {
        savedIdleTimerRef.current = null
        setSaveStatus('idle')
      }, SAVED_IDLE_MS)
    },
    [testType]
  )

  const scheduleSave = useCallback(
    (draft: T) => {
      latestDraftRef.current = draft
      if (!allowSaveRef.current) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        const latest = latestDraftRef.current
        if (latest) void flushSave(latest)
      }, SAVE_DEBOUNCE_MS)
    },
    [flushSave]
  )

  /** Immediate server write (explicit Save draft). Still no-ops until resume resolved. */
  const flushSaveNow = useCallback(
    (draft: T) => {
      latestDraftRef.current = draft
      if (!allowSaveRef.current) return
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      void flushSave(draft)
    },
    [flushSave]
  )

  const acceptResume = useCallback(async () => {
    if (!resumeOffer) return
    setResumeBusy(true)
    const result = await getStudyDraftAction(resumeOffer.id)
    setResumeBusy(false)
    if (!result.ok) {
      console.warn('[study-draft] load failed:', result.error)
      setResumeOffer(null)
      resumeResolvedRef.current = true
      allowSaveRef.current = true
      return
    }
    const json = result.draft.draft_json
    if (json == null || typeof json !== 'object' || Array.isArray(json)) {
      setResumeOffer(null)
      resumeResolvedRef.current = true
      allowSaveRef.current = true
      return
    }
    const record = json as Record<string, unknown>
    serverDraftIdRef.current = result.draft.id
    setServerDraftId(result.draft.id)
    onHydrateRef.current(record, result.draft.id)
    const localId = typeof record.draftId === 'string' ? record.draftId : null
    if (localId) bindServerDraftId(localId, result.draft.id)
    setResumeOffer(null)
    resumeResolvedRef.current = true
    allowSaveRef.current = true
  }, [resumeOffer])

  const dismissResume = useCallback(() => {
    setResumeOffer(null)
    resumeResolvedRef.current = true
    allowSaveRef.current = true
  }, [])

  /** Best-effort delete after publish — never blocks success UX. */
  const deleteOnPublish = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const id = serverDraftIdRef.current
    const localId = localDraftIdRef.current
    if (localId) unbindServerDraftId(localId)
    if (!id) return
    try {
      const result = await deleteStudyDraftAction(id)
      if (!result.ok) {
        console.warn('[study-draft] delete-on-publish failed:', result.error)
      }
    } catch (err) {
      console.warn('[study-draft] delete-on-publish threw:', err)
    }
    serverDraftIdRef.current = null
    setServerDraftId(null)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (savedIdleTimerRef.current) clearTimeout(savedIdleTimerRef.current)
    }
  }, [])

  return {
    serverDraftId,
    resumeOffer,
    resumeBusy,
    saveStatus,
    scheduleSave,
    flushSaveNow,
    acceptResume,
    dismissResume,
    deleteOnPublish,
    formatResumeWhen,
  }
}
