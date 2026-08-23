'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { ConceptPublishSuccessMeta, ConceptStudyDraft } from '@/lib/concept/types'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import { normalizeDraft } from '@/lib/concept/normalizeDraft'
import { deleteConceptDraft, saveConceptDraft } from '@/lib/concept/draftStore'
import { evaluateFieldValidity, type ConceptPublishFailure } from '@/lib/concept/validity'
import {
  createConceptCampaignAction,
  publishConceptStudyAction,
} from './actions'
import AudienceSection from './AudienceSection'
import BattleSettingsSection from './BattleSettingsSection'
import ModulesSection from './ModulesSection'
import FieldSection from './FieldSection'
import QuestionsSection from './QuestionsSection'
import StudyTypeSection from './StudyTypeSection'
import ResumeDraftBanner from '../components/ResumeDraftBanner'
import {
  formatResumeWhen,
  useServerStudyDraft,
} from '@/lib/studies/useServerStudyDraft'
import './conceptBuilder.css'

type Props = {
  initialDraft: ConceptStudyDraft
  mode: 'new' | 'edit'
}

export default function ConceptStudyClient({ initialDraft, mode }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<ConceptStudyDraft>(() =>
    normalizeDraft(initialDraft)
  )
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [publishMeta, setPublishMeta] = useState<ConceptPublishSuccessMeta | null>(null)
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
  const lockReason = !draft.stimulusMode
    ? 'Choose a study type and category above to unlock the field.'
    : 'Choose a category above to unlock the field.'
  const setupDone = !!draft.stimulusMode && draft.taxonomyNodeId != null
  const fieldDone = validity.fieldOk && !!draft.title.trim()
  const questionsDone = validity.templateOk
  const audienceDone = validity.audienceOk
  const stickyNeeds = useMemo(() => {
    const items = [...validity.outstanding, ...validity.softOutstanding]
    return items
  }, [validity.outstanding, validity.softOutstanding])
  const rootRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  // Purely presentational: how many blockers the dock shows. Never touches validity.
  const [needsExpanded, setNeedsExpanded] = useState(false)

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

  // The sticky footer grows with the number of outstanding items. Publish its real
  // height so the page can reserve exactly that much bottom space.
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

    if (
      (draft.stimulusMode === 'package' || draft.stimulusMode === 'price') &&
      !validity.hasVerificationScreener
    ) {
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
        ...(draft.stimulusMode === 'package' || draft.stimulusMode === 'price'
          ? {
              pricePosture: 'blind' as const,
              conceptArms: draft.conceptArms.map((a) => ({ ...a, frozen_price: null })),
              products: draft.products.map((p) => ({ ...p, frozen_price: null })),
            }
          : {}),
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
      router.push(`/studies/concept/${publishMeta.missionId}?published=1`)
    })
  }

  const ready = validity.readyToPublish && validity.softOutstanding.length === 0

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="concept-builder" ref={rootRef}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
          gap: 16,
        }}
      >
        <div>
          <Link
            href="/studies"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ink-50)',
              textDecoration: 'none',
            }}
          >
            ← Studies
          </Link>
          <h1 className="cb-page-title">Concept study</h1>
          <p
            style={{
              margin: '8px 0 0',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink-50)',
            }}
          >
            {draft.stimulusMode === 'package'
              ? 'Packaging concept test'
              : draft.stimulusMode === 'price'
                ? 'Blind price concept test'
                : 'Operator console'}
          </p>
        </div>
      </div>

      {resumeOffer ? (
        <ResumeDraftBanner
          title={resumeOffer.title}
          whenLabel={formatResumeWhen(resumeOffer.updatedAt)}
          busy={resumeBusy}
          onResume={() => void acceptResume()}
          onStartFresh={dismissResume}
        />
      ) : null}

      <nav className="cb-progress" aria-label="Study builder steps">
        {(
          [
            { id: 'concept-mode', label: 'Setup', done: setupDone, active: !setupDone },
            {
              id: 'concept-field',
              label: 'Field',
              done: setupDone && fieldDone,
              active: setupDone && !fieldDone,
            },
            {
              id: 'concept-questions',
              label: 'Questionnaire',
              done: setupDone && fieldDone && questionsDone,
              active: setupDone && fieldDone && !questionsDone,
            },
            {
              id: 'concept-audience',
              label: 'Audience',
              done: setupDone && fieldDone && questionsDone && audienceDone,
              active: setupDone && fieldDone && questionsDone && !audienceDone,
            },
            {
              id: 'concept-modules',
              label: 'Modules',
              done: setupDone && fieldDone && questionsDone && audienceDone,
              active: false,
            },
            {
              id: 'concept-battle-settings',
              label: 'Battle settings',
              done: validity.readyToPublish,
              active:
                setupDone &&
                fieldDone &&
                questionsDone &&
                audienceDone &&
                !validity.readyToPublish,
            },
          ] as const
        ).map((step, i) => (
          <button
            key={`${step.label}-${i}`}
            type="button"
            data-done={step.done}
            data-active={step.active}
            onClick={() => scrollTo(step.id)}
          >
            <span className="cb-progress-dot" aria-hidden />
            {step.done ? '✓ ' : ''}
            {step.label}
          </button>
        ))}
      </nav>

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
      />

      <FieldSection
        draft={draft}
        onChange={persist}
        error={sectionErrors.field ?? null}
        publishFailure={publishFailure}
        disabled={builderLocked}
        disabledReason={builderLocked ? lockReason : null}
      />

      <QuestionsSection
        draft={draft}
        onChange={persist}
        error={sectionErrors.questions ?? null}
        disabled={builderLocked}
        disabledReason={builderLocked ? lockReason : null}
      />

      <AudienceSection
        draft={draft}
        onChange={persist}
        error={sectionErrors.audience ?? null}
        disabled={builderLocked}
        disabledReason={builderLocked ? lockReason : null}
      />

      <ModulesSection
        draft={draft}
        onChange={persist}
        disabled={builderLocked}
        disabledReason={builderLocked ? lockReason : null}
      />

      <BattleSettingsSection
        draft={draft}
        onChange={persist}
        disabled={builderLocked}
        disabledReason={builderLocked ? lockReason : null}
      />

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

      {publishMeta ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-confirm-title"
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
              maxWidth: 480,
              width: '100%',
              padding: 24,
              boxShadow: 'var(--cb-shadow-modal)',
            }}
          >
            <h2
              id="publish-confirm-title"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink-80)',
                margin: '0 0 8px',
              }}
            >
              Study published
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}>
              Confirm the shape of what was created before leaving the builder.
            </p>
            <dl
              style={{
                margin: 0,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 16px',
                fontSize: 13,
              }}
            >
              <div>
                <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
                  Field size
                </dt>
                <dd style={{ margin: 0 }}>{publishMeta.field_size ?? '—'}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
                  Unique pairs
                </dt>
                <dd style={{ margin: 0 }}>{publishMeta.unique_pairs ?? '—'}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
                  Rounds / respondent
                </dt>
                <dd style={{ margin: 0 }}>{publishMeta.rounds_per_respondent ?? '—'}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
                  Target completions
                </dt>
                <dd style={{ margin: 0 }}>{publishMeta.target_completions ?? '—'}</dd>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
                  Template
                </dt>
                <dd style={{ margin: 0 }}>{publishMeta.template_code ?? '—'}</dd>
              </div>
              {publishMeta.coverage_note ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
                    Coverage
                  </dt>
                  <dd style={{ margin: 0, lineHeight: 1.4 }}>{publishMeta.coverage_note}</dd>
                </div>
              ) : null}
            </dl>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                type="button"
                onClick={confirmPublished}
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
                }}
              >
                Continue to study
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Publishing dock. Presentation only — `stickyNeeds` is the same
          authoritative collection as before, and each row reuses the existing
          anchor navigation. Collapsing/expanding never touches validity. */}
      <div className="cb-sticky" ref={stickyRef}>
        <div className="cb-sticky-inner">
          <div className="cb-dock-summary">
            {ready ? (
              <>
                <span className="cb-dock-summary-head">
                  <span className="cb-field-status-icon" data-tone="ok" aria-hidden>
                    ✓
                  </span>
                  Ready to publish
                </span>
                <p className="cb-dock-summary-help">All required fields are complete.</p>
              </>
            ) : (
              <>
                <span className="cb-dock-summary-head">
                  <span className="cb-field-status-icon" data-tone="warn" aria-hidden>
                    !
                  </span>
                  Still needed
                </span>
                <p className="cb-dock-summary-help">Complete these to publish your study.</p>
              </>
            )}
          </div>

          {ready ? (
            <div />
          ) : (
            <div className="cb-dock-tasks" id="cb-dock-tasks">
              {(needsExpanded ? stickyNeeds : stickyNeeds.slice(0, 3)).map((item) => (
                <button
                  key={item.message}
                  type="button"
                  className="cb-dock-task"
                  onClick={() => {
                    if (item.anchor) scrollTo(item.anchor)
                  }}
                >
                  <span className="cb-dock-task-dot" aria-hidden />
                  {item.message}
                </button>
              ))}
              {stickyNeeds.length > 3 ? (
                <p className="cb-dock-overflow">
                  {!needsExpanded ? <span>+{stickyNeeds.length - 3} more</span> : null}
                  <button
                    type="button"
                    className="cb-quiet-action"
                    aria-expanded={needsExpanded}
                    aria-controls="cb-dock-tasks"
                    onClick={() => setNeedsExpanded((v) => !v)}
                  >
                    {needsExpanded ? 'Show less' : 'View all'}
                  </button>
                </p>
              ) : null}
            </div>
          )}

          <div className="cb-dock-actions">
            <span
              aria-live="polite"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 500,
                color:
                  saveStatus === 'error' ? 'var(--coral, #c45c4a)' : 'var(--ink-30)',
                minWidth: 72,
                textAlign: 'right',
              }}
            >
              {saveStatus === 'saving'
                ? 'Syncing…'
                : saveStatus === 'saved'
                  ? 'Saved'
                  : saveStatus === 'error'
                    ? 'Sync failed'
                    : ''}
            </span>
            <button
              type="button"
              className="cb-btn cb-btn-secondary"
              onClick={saveDraft}
              disabled={saving || publishing || pending || !!publishMeta}
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              className="cb-btn cb-btn-secondary"
              disabled={!validity.readyToPublish || publishing || pending || !!publishMeta}
              onClick={() => {
                flushSaveNow(draft)
                router.push(`/studies/concept/${draft.draftId}/preview`)
              }}
            >
              Preview / Walk through this study
            </button>
            <button
              type="button"
              className="cb-btn cb-btn-primary"
              data-muted={!validity.readyToPublish || publishing}
              onClick={() => requestPublish()}
              disabled={publishing || pending || !!publishMeta}
            >
              {publishing ? 'Publishing…' : 'Publish study'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
