'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import CheckoutHandoff, { AwaitingPaymentNotice } from './CheckoutHandoff'
import type { ConceptPublishSuccessMeta, ConceptStudyDraft } from '@/lib/concept/types'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import { normalizeDraft } from '@/lib/concept/normalizeDraft'
import { deleteConceptDraft, saveConceptDraft } from '@/lib/concept/draftStore'
import { evaluateFieldValidity, CONCEPT_ANCHORS, type ConceptPublishFailure } from '@/lib/concept/validity'
import {
  createConceptCampaignAction,
  publishConceptStudyAction,
} from './actions'
import AudienceSection from './AudienceSection'
import FieldSection from './FieldSection'
import SingleTestJourneySection from './SingleTestJourneySection'
import StudyTypeSection from './StudyTypeSection'
import BuilderStepper from './BuilderStepper'
import ResumeDraftBanner from '../components/ResumeDraftBanner'
import PublishingDock from '../components/PublishingDock'
import {
  formatResumeWhen,
  useServerStudyDraft,
} from '@/lib/studies/useServerStudyDraft'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import './conceptBuilder.css'

type Props = {
  initialDraft: ConceptStudyDraft
  mode: 'new' | 'edit'
  /** Hide Publish for viewers (missions.write). */
  canPublish?: boolean
}

export default function ConceptStudyClient({
  initialDraft,
  mode,
  canPublish = true,
}: Props) {
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
  const [sectionErrors, setSectionErrors] = useState<{
    title?: string
    mode?: string
    field?: string
    questions?: string
    audience?: string
    advanced?: string
    publish?: string
  }>({})
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
  const rootRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)

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

  const ready = validity.readyToPublish && validity.softOutstanding.length === 0

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="concept-builder" ref={rootRef}>
      <header className="cb-page-head">
        <Link href="/studies" className="cb-back">
          ← Studies
        </Link>
        <h1 className="cb-page-title">{draft.title.trim() || 'Concept study'}</h1>
      </header>

      {resumeOffer ? (
        <ResumeDraftBanner
          title={resumeOffer.title}
          whenLabel={formatResumeWhen(resumeOffer.updatedAt)}
          busy={resumeBusy}
          onResume={() => void acceptResume()}
          onStartFresh={dismissResume}
        />
      ) : null}

      {publishMeta && !handoffOpen ? (
        <AwaitingPaymentNotice onContinue={confirmPublished} />
      ) : null}

      <BuilderStepper
        label="Concept study sections"
        steps={[
          { id: CONCEPT_ANCHORS.mode, label: 'Setup', done: setupDone },
          {
            id: CONCEPT_ANCHORS.field,
            label: 'Field',
            done: setupDone && fieldDone,
          },
          {
            id: CONCEPT_ANCHORS.questions,
            label: 'Questionnaire',
            done: setupDone && fieldDone && questionsDone,
          },
          ...(STUDY_AUDIENCE_BUILDER_ENABLED
            ? [
                {
                  id: CONCEPT_ANCHORS.audience,
                  label: 'Audience',
                  done: setupDone && fieldDone && questionsDone && validity.audienceOk,
                },
              ]
            : []),
        ]}
      />

      {toast ? (
        <div
          role="status"
          style={{
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--sage-dark)',
            background: 'var(--sage-soft)',
            border: '1px solid rgba(62, 107, 74, 0.2)',
            borderRadius: 'var(--r-md)',
            padding: '12px 16px',
          }}
        >
          {toast}
        </div>
      ) : null}

      {/* Study name moved into Section 0 (Pass 2). The `concept-study-name` id
          travels with the input, so the sticky-footer anchor is unchanged. */}
      <StudyTypeSection
        draft={draft}
        onChange={persist}
        error={sectionErrors.mode ?? null}
        titleError={sectionErrors.title ?? null}
        showErrors={publishAttempted}
        packagingOnly
        minCompletions={30}
      />

      <FieldSection
        draft={draft}
        onChange={persist}
        error={sectionErrors.field ?? null}
        publishFailure={publishFailure}
        disabled={builderLocked}
        disabledReason={builderLocked ? lockReason : null}
        singleTestMode
      />

      <SingleTestJourneySection
        draft={draft}
        onChange={persist}
        error={sectionErrors.questions ?? null}
        disabled={builderLocked}
        canPreview={validity.readyToPublish}
        onPreview={() => {
          flushSaveNow(draft)
          router.push(`/studies/concept/${draft.draftId}/preview`)
        }}
      />

      {STUDY_AUDIENCE_BUILDER_ENABLED ? (
        <AudienceSection
          draft={draft}
          onChange={persist}
          error={sectionErrors.audience ?? null}
          disabled={builderLocked}
          disabledReason={builderLocked ? lockReason : null}
        />
      ) : null}


      {sectionErrors.publish &&
      !sectionErrors.field &&
      !sectionErrors.questions &&
      !sectionErrors.audience &&
      !sectionErrors.mode ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
          {sectionErrors.publish}
        </p>
      ) : null}

      {noVerificationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="no-verification-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(20, 24, 20, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--r-lg)',
              maxWidth: 440,
              width: '100%',
              padding: 24,
              boxShadow: 'var(--cb-shadow-modal)',
            }}
          >
            <h2
              id="no-verification-title"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink-80)',
                margin: '0 0 8px',
              }}
            >
              Publish without purchase verification?
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}>
              You haven’t added verification brands. Respondents won’t be screened on
              recent purchase — anyone in the category can qualify. You can still publish.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setNoVerificationOpen(false)
                  document
                    .getElementById('concept-q-verification_options')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  border: '1px solid var(--ink-10)',
                  background: 'var(--white)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 36,
                  padding: '0 16px',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                }}
              >
                Add brands
              </button>
              <button
                type="button"
                onClick={() => void publishConfirmed()}
                disabled={publishing}
                style={{
                  border: 'none',
                  background: 'var(--sage)',
                  color: 'var(--white)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 36,
                  padding: '0 16px',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  opacity: publishing ? 0.7 : 1,
                }}
              >
                Publish anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {publishMeta && handoffOpen ? (
        <CheckoutHandoff
          draft={draft}
          meta={publishMeta}
          onClose={() => setHandoffOpen(false)}
          onContinue={confirmPublished}
        />
      ) : null}

      <PublishingDock
        stickyRef={stickyRef}
        ready={ready && canPublish}
        needs={stickyNeeds}
        saveStatus={saveStatus}
        saving={saving}
        publishing={publishing}
        actionsLocked={pending || handoffOpen || !canPublish}
        publishMuted={!canPublish || !validity.readyToPublish || publishing || !!publishMeta}
        publishDisabled={!!publishMeta}
        holdLabel={publishMeta ? 'Awaiting payment' : undefined}
        publishLabel={publishMeta ? 'Awaiting payment' : canPublish ? 'Publish study' : 'View only'}
        showPreview
        previewLabel="Preview"
        canPreview={validity.readyToPublish}
        onSave={saveDraft}
        onPublish={() => {
          if (!canPublish) return
          requestPublish()
        }}
        onPreview={() => {
          flushSaveNow(draft)
          router.push(`/studies/concept/${draft.draftId}/preview`)
        }}
        onScrollTo={scrollTo}
      />
    </div>
  )
}
