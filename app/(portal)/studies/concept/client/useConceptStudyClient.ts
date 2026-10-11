'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { ConceptPublishSuccessMeta, ConceptStudyDraft } from '@/lib/concept/types'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import { normalizeDraft } from '@/lib/concept/normalizeDraft'
import { deleteConceptDraft, saveConceptDraft } from '@/lib/concept/draftStore'
import {
  evaluateFieldValidity,
  type ConceptPublishFailure,
} from '@/lib/concept/validity'
import { summarizeDockReady } from '@/lib/concept/builderSummaries'
import {
  createConceptCampaignAction,
  publishConceptStudyAction,
} from '../actions'
import { useServerStudyDraft } from '@/lib/studies/useServerStudyDraft'
import type { ConceptErrorSection } from '@/lib/concept/errors'

export type SectionErrors = Partial<Record<ConceptErrorSection, string>>

export function useConceptStudyClient({
  initialDraft,
  mode,
}: {
  initialDraft: ConceptStudyDraft
  mode: 'new' | 'edit'
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<ConceptStudyDraft>(() =>
    normalizeDraft(initialDraft)
  )
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [publishMeta, setPublishMeta] = useState<ConceptPublishSuccessMeta | null>(null)
  const [handoffOpen, setHandoffOpen] = useState(false)
  const [noVerificationOpen, setNoVerificationOpen] = useState(false)
  const [publishAttempted, setPublishAttempted] = useState(false)
  const [sectionErrors, setSectionErrors] = useState<SectionErrors>({})
  const [publishFailure, setPublishFailure] = useState<ConceptPublishFailure | null>(null)

  const validity = useMemo(() => evaluateFieldValidity(draft), [draft])
  const builderLocked = !draft.stimulusMode || draft.taxonomyNodeId == null
  const lockReason = 'Choose a category above to unlock the field.'
  const setupDone = !!draft.stimulusMode && draft.taxonomyNodeId != null
  const fieldDone = validity.fieldOk && !!draft.title.trim()
  const questionsDone = validity.templateOk
  const stickyNeeds = useMemo(() => {
    const items = [...validity.outstanding, ...validity.softOutstanding]
    return items
  }, [validity.outstanding, validity.softOutstanding])
  const readyFacts = useMemo(() => summarizeDockReady(draft), [draft])
  const rootRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)

  function scrollToAnchor(anchor: string) {
    const target = document.getElementById(anchor)
    const section = target?.closest('.cb-builder-section') ?? document.getElementById(anchor)
    section?.dispatchEvent(new Event('cb-expand-section'))
    window.setTimeout(() => {
      const el = document.getElementById(anchor)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }

  const hydrateFromServer = useCallback(
    (draftJson: Record<string, unknown>, _serverId: string) => {
      const merged = normalizeDraft({
        ...createEmptyConceptDraft({ brandId: initialDraft.brandId }),
        ...draftJson,
        brandId: initialDraft.brandId,
      } as ConceptStudyDraft)
      setDraft(merged)
      saveConceptDraft(merged)
    },
    [initialDraft.brandId]
  )

  const {
    resumeOffer,
    resumeBusy,
    saveStatus,
    scheduleSave,
    flushSaveNow,
    acceptResume,
    dismissResume,
    deleteOnPublish,
  } = useServerStudyDraft<ConceptStudyDraft>({
    testType: 'concept',
    offerResume: mode === 'new',
    localDraftId: draft.draftId,
    getTitle: (d) => d.title,
    getLocalDraftId: (d) => d.draftId,
    onHydrate: hydrateFromServer,
  })

  const persist = useCallback(
    (next: ConceptStudyDraft) => {
      const normalized = normalizeDraft(next)
      setDraft(normalized)
      saveConceptDraft(normalized)
      scheduleSave(normalized)
    },
    [scheduleSave]
  )

  useEffect(() => {
    if (mode === 'new') {
      saveConceptDraft(normalizeDraft(initialDraft))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, [])

  // Slim dock height → CSS var so the page reserves exactly that much bottom space.
  useEffect(() => {
    const bar = stickyRef.current
    const root = rootRef.current
    if (!bar || !root) return
    const apply = () => {
      const h = `${Math.ceil(bar.getBoundingClientRect().height)}px`
      root.style.setProperty('--cb-sticky-h', h)
      // The document is the scroll owner, so scroll-padding-bottom has to read
      // the measured height from <html>, not from the builder root.
      document.documentElement.style.setProperty('--cb-sticky-h', h)
    }
    apply()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(apply)
    ro.observe(bar)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function saveDraft() {
    setSaving(true)
    const saved = saveConceptDraft(draft)
    setDraft(saved)
    flushSaveNow(saved)
    setSaving(false)
    setToast('Draft saved')
    if (mode === 'new') {
      startTransition(() => {
        router.replace(`/studies/concept/${saved.draftId}/edit`)
      })
    }
  }

  async function ensureCampaign(): Promise<string | null> {
    // One study = one campaign. Reuse the campaign already created for this draft,
    // otherwise create one named from the study name.
    if (draft.brandCampaignId) {
      return draft.brandCampaignId
    }
    if (draft.taxonomyNodeId == null) {
      setSectionErrors({ mode: 'Choose a category for this study.' })
      document.getElementById('concept-category')?.scrollIntoView({ behavior: 'smooth' })
      return null
    }
    const created = await createConceptCampaignAction({
      brandId: draft.brandId,
      campaignName: draft.title.trim() || 'Concept study',
      taxonomyNodeId: draft.taxonomyNodeId,
    })
    if (!created.ok) {
      setSectionErrors({ title: created.error })
      return null
    }
    const next = { ...draft, brandCampaignId: created.campaignId }
    persist(next)
    return created.campaignId
  }

  function requestPublish() {
    if (publishMeta) return
    setPublishAttempted(true)
    setSectionErrors({})
    setPublishFailure(null)
    if (!draft.stimulusMode) {
      const msg = 'Choose what you are testing before publishing.'
      setSectionErrors({ mode: msg, publish: msg })
      document.getElementById('concept-mode')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (draft.taxonomyNodeId == null) {
      const msg = 'Choose a category for this study.'
      setSectionErrors({ mode: msg, publish: msg })
      document.getElementById('concept-category')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (!validity.readyToPublish) {
      const first = validity.outstanding[0]
      const msg = first?.message ?? validity.reasons[0] ?? 'Finish the study before publishing.'
      const section = !validity.modeOk
        ? 'mode'
        : !validity.templateOk
          ? 'questions'
          : !validity.audienceOk
            ? 'audience'
            : 'field'
      setSectionErrors({ [section]: msg, publish: msg })
      const anchor = first?.anchor ?? 'concept-field'
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    if (draft.stimulusMode === 'package' && !validity.hasVerificationScreener) {
      setNoVerificationOpen(true)
      return
    }

    void publishConfirmed()
  }

  async function publishConfirmed() {
    setNoVerificationOpen(false)
    setPublishing(true)
    try {
      const campaignId = await ensureCampaign()
      if (!campaignId) {
        setPublishing(false)
        return
      }

      const toPublish: ConceptStudyDraft = {
        ...draft,
        brandCampaignId: campaignId,
        pricePosture: 'blind',
        conceptArms: draft.conceptArms.map((a) => ({ ...a, frozen_price: null })),
        products: draft.products.map((p) => ({ ...p, frozen_price: null })),
      }
      const result = await publishConceptStudyAction(toPublish)
      if (!result.ok) {
        setSectionErrors({
          [result.section]: result.error,
          publish: result.error,
        })
        setPublishFailure({
          hint: result.hint,
          productId: result.productId ?? null,
          upc: result.upc ?? null,
        })
        const anchor =
          result.section === 'mode'
            ? 'concept-mode'
            : result.section === 'field'
              ? 'concept-field'
              : result.section === 'questions'
                ? 'concept-questions'
                : result.section === 'audience'
                  ? 'concept-audience'
                  : null
        if (anchor) {
          document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
        }
        setPublishing(false)
        return
      }

      setPublishing(false)
      setPublishMeta(result.meta)
      setHandoffOpen(true)
    } catch (err) {
      setSectionErrors({
        publish: err instanceof Error ? err.message : 'Publish failed.',
      })
      setPublishing(false)
    }
  }

  function confirmPublished() {
    if (!publishMeta) return
    deleteConceptDraft(draft.draftId)
    void deleteOnPublish()
    startTransition(() => {
      router.push(`/studies/${publishMeta.missionId}/checkout`)
    })
  }

  function addVerificationBrands() {
    setNoVerificationOpen(false)
    document
      .getElementById('concept-q-verification_options')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  const ready = validity.readyToPublish && validity.softOutstanding.length === 0

  function scrollTo(id: string) {
    scrollToAnchor(id)
  }

  return {
    draft,
    persist,
    builderLocked,
    lockReason,
    setupDone,
    fieldDone,
    questionsDone,
    validity,
    stickyNeeds,
    readyFacts,
    ready,
    rootRef,
    stickyRef,
    scrollToAnchor,
    resumeOffer,
    resumeBusy,
    saveStatus,
    flushSaveNow,
    acceptResume,
    dismissResume,
    toast,
    publishMeta,
    handoffOpen,
    setHandoffOpen,
    noVerificationOpen,
    publishAttempted,
    sectionErrors,
    publishFailure,
    saving,
    publishing,
    pending,
    saveDraft,
    requestPublish,
    publishConfirmed,
    confirmPublished,
    addVerificationBrands,
    scrollTo,
    router,
  }
}
