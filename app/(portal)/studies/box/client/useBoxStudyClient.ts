'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { BoxPublishSuccessMeta, BoxStudyDraft } from '@/lib/box/types'
import { createEmptyBoxDraft } from '@/lib/box/defaults'
import { deleteBoxDraft, normalizeStoredBoxDraft, saveBoxDraft } from '@/lib/box/draftStore'
import {
  BOX_ANCHORS,
  evaluateBoxValidity,
  type BoxPublishFailure,
} from '@/lib/box/validity'
import { summarizeBoxDockReady } from '@/lib/box/builderSummaries'
import { publishBoxStudyAction, createBoxCampaignAction } from '../actions'
import { alcoholDetected } from '@/lib/box/risk'
import { useBoxTaxonomyRisk } from './useBoxTaxonomyRisk'
import { useServerStudyDraft } from '@/lib/studies/useServerStudyDraft'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import type { BoxErrorSection } from '@/lib/box/errors'

export type SectionErrors = Partial<Record<BoxErrorSection, string>>

const SECTION_ANCHOR: Record<BoxErrorSection, string> = {
  setup: BOX_ANCHORS.setup,
  field: BOX_ANCHORS.field,
  audience: BOX_ANCHORS.audience,
  /** Scale fields live in Setup; Day 2 interval scrolls to Questions. */
  logistics: BOX_ANCHORS.setup,
  risk: BOX_ANCHORS.risk,
  publish: BOX_ANCHORS.setup,
}

export function useBoxStudyClient({
  initialDraft,
  mode,
}: {
  initialDraft: BoxStudyDraft
  mode: 'new' | 'edit'
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<BoxStudyDraft>(initialDraft)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [publishMeta, setPublishMeta] = useState<BoxPublishSuccessMeta | null>(null)
  const [openAudienceConfirm, setOpenAudienceConfirm] = useState(false)
  const [publishAttempted, setPublishAttempted] = useState(false)
  const [sectionErrors, setSectionErrors] = useState<SectionErrors>({})
  const [publishFailure, setPublishFailure] = useState<BoxPublishFailure | null>(null)

  const taxonomyRisk = useBoxTaxonomyRisk(draft)
  const validity = useMemo(
    () => evaluateBoxValidity(draft, taxonomyRisk),
    [draft, taxonomyRisk]
  )
  const stickyNeeds = useMemo(
    () => [...validity.outstanding, ...validity.softOutstanding],
    [validity.outstanding, validity.softOutstanding]
  )
  const ready = validity.readyToPublish && validity.softOutstanding.length === 0
  const readyFacts = useMemo(() => summarizeBoxDockReady(draft), [draft])
  const rootRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)

  const hydrateFromServer = useCallback(
    (draftJson: Record<string, unknown>, _serverId: string) => {
      const merged = normalizeStoredBoxDraft(
        {
          ...createEmptyBoxDraft(initialDraft.brandId),
          ...draftJson,
          brandId: initialDraft.brandId,
        } as Partial<BoxStudyDraft>,
        initialDraft.brandId
      )
      setDraft(merged)
      saveBoxDraft(merged)
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
  } = useServerStudyDraft<BoxStudyDraft>({
    testType: 'ihut',
    offerResume: mode === 'new',
    localDraftId: draft.draftId,
    getTitle: (d) => d.title,
    getLocalDraftId: (d) => d.draftId,
    onHydrate: hydrateFromServer,
  })

  const persist = useCallback(
    (next: BoxStudyDraft) => {
      const saved = saveBoxDraft(next)
      setDraft(saved)
      scheduleSave(saved)
    },
    [scheduleSave]
  )

  const markContainsAlcohol = useCallback(() => {
    if (draft.riskDeclaration.containsAlcohol === true) return
    persist({
      ...draft,
      riskDeclaration: { ...draft.riskDeclaration, containsAlcohol: true },
    })
  }, [draft, persist])

  useEffect(() => {
    if (alcoholDetected(taxonomyRisk)) markContainsAlcohol()
  }, [taxonomyRisk, markContainsAlcohol])

  useEffect(() => {
    if (mode === 'new') saveBoxDraft(initialDraft)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, [])

  // Sticky dock height → CSS var, same mechanism as the concept builder.
  useEffect(() => {
    const bar = stickyRef.current
    const root = rootRef.current
    if (!bar || !root) return
    const apply = () => {
      const h = `${Math.ceil(bar.getBoundingClientRect().height)}px`
      root.style.setProperty('--cb-sticky-h', h)
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

  function scrollTo(id: string) {
    const target = document.getElementById(id)
    const section = target?.closest('.cb-builder-section') ?? document.getElementById(id)
    section?.dispatchEvent(new Event('cb-expand-section'))
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }

  function saveDraft() {
    setSaving(true)
    const saved = saveBoxDraft(draft)
    setDraft(saved)
    flushSaveNow(saved)
    setSaving(false)
    setToast('Draft saved')
    if (mode === 'new') {
      startTransition(() => {
        router.replace(`/studies/box/${saved.draftId}/edit`)
      })
    }
  }

  async function ensureCampaign(): Promise<string | null> {
    if (draft.brandCampaignId) return draft.brandCampaignId
    const created = await createBoxCampaignAction({
      brandId: draft.brandId,
      campaignName: draft.title.trim() || 'Box study',
    })
    if (!created.ok) {
      setSectionErrors({ setup: created.error })
      scrollTo(BOX_ANCHORS.setup)
      return null
    }
    const next = { ...draft, brandCampaignId: created.campaignId }
    persist(next)
    return created.campaignId
  }

  function requestPublish() {
    setPublishAttempted(true)
    setSectionErrors({})
    setPublishFailure(null)
    if (!validity.readyToPublish) {
      const first = validity.outstanding[0]
      const msg = first?.message ?? 'Finish the box before publishing.'
      const section: keyof SectionErrors = !validity.setupOk
        ? 'setup'
        : !validity.fieldOk
          ? 'field'
          : !validity.audienceOk
            ? 'audience'
            : first?.anchor === BOX_ANCHORS.risk
              ? 'risk'
              : first?.anchor === BOX_ANCHORS.sessions
              ? 'publish'
              : 'logistics'
      setSectionErrors({ [section]: msg, publish: msg })
      scrollTo(first?.anchor ?? SECTION_ANCHOR[section])
      return
    }
    if (STUDY_AUDIENCE_BUILDER_ENABLED && validity.openAudience) {
      setOpenAudienceConfirm(true)
      return
    }
    void publishConfirmed()
  }

  async function publishConfirmed() {
    setOpenAudienceConfirm(false)
    setPublishing(true)
    try {
      const campaignId = await ensureCampaign()
      if (!campaignId) {
        setPublishing(false)
        return
      }
      const result = await publishBoxStudyAction({ ...draft, brandCampaignId: campaignId })
      if (!result.ok) {
        if (result.hint === 'ALCOHOL_SHIPPING_ATTESTATION_REQUIRED') markContainsAlcohol()
        setSectionErrors({ [result.section]: result.error, publish: result.error })
        setPublishFailure({
          hint: result.hint,
          productId: result.productId ?? null,
          upc: result.upc ?? null,
        })
        scrollTo(SECTION_ANCHOR[result.section] ?? BOX_ANCHORS.setup)
        setPublishing(false)
        return
      }
      setPublishing(false)
      setPublishMeta(result.meta)
    } catch (err) {
      setSectionErrors({ publish: err instanceof Error ? err.message : 'Publish failed.' })
      setPublishing(false)
    }
  }

  function confirmPublished() {
    if (!publishMeta) return
    deleteBoxDraft(draft.draftId)
    void deleteOnPublish()
    startTransition(() => {
      router.push('/studies?boxPublished=1')
    })
  }

  return {
    draft,
    persist,
    pending,
    saving,
    publishing,
    toast,
    publishMeta,
    openAudienceConfirm,
    setOpenAudienceConfirm,
    publishAttempted,
    sectionErrors,
    publishFailure,
    validity,
    taxonomyRisk,
    stickyNeeds,
    ready,
    readyFacts,
    rootRef,
    stickyRef,
    resumeOffer,
    resumeBusy,
    saveStatus,
    acceptResume,
    dismissResume,
    saveDraft,
    requestPublish,
    publishConfirmed,
    confirmPublished,
    scrollTo,
    router,
  }
}
