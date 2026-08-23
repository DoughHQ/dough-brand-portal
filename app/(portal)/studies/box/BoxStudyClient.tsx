'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { BoxPublishSuccessMeta, BoxStudyDraft } from '@/lib/box/types'
import { BOX_DEFAULT_BATTLE_QUESTION } from '@/lib/box/constants'
import { createEmptyBoxDraft } from '@/lib/box/defaults'
import { deleteBoxDraft, normalizeStoredBoxDraft, saveBoxDraft } from '@/lib/box/draftStore'
import { BOX_ANCHORS, evaluateBoxValidity, type BoxPublishFailure } from '@/lib/box/validity'
import { publishBoxStudyAction, createBoxCampaignAction } from './actions'
import SetupSection from './SetupSection'
import ContentsSection from './ContentsSection'
import BattleSection from './BattleSection'
import AudienceSection from './AudienceSection'
import LogisticsSection from './LogisticsSection'
import ResumeDraftBanner from '../components/ResumeDraftBanner'
import {
  formatResumeWhen,
  useServerStudyDraft,
} from '@/lib/studies/useServerStudyDraft'
import '../concept/conceptBuilder.css'

type Props = {
  initialDraft: BoxStudyDraft
  mode: 'new' | 'edit'
  isImpersonating: boolean
}

type SectionErrors = {
  setup?: string
  field?: string
  audience?: string
  logistics?: string
  publish?: string
}

const SECTION_ANCHOR: Record<keyof SectionErrors, string> = {
  setup: BOX_ANCHORS.setup,
  field: BOX_ANCHORS.field,
  audience: BOX_ANCHORS.audience,
  logistics: BOX_ANCHORS.logistics,
  publish: BOX_ANCHORS.logistics,
}

export default function BoxStudyClient({ initialDraft, mode, isImpersonating }: Props) {
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

  const validity = useMemo(() => evaluateBoxValidity(draft), [draft])
  const stickyNeeds = useMemo(
    () => [...validity.outstanding, ...validity.softOutstanding],
    [validity.outstanding, validity.softOutstanding]
  )
  const ready = validity.readyToPublish && validity.softOutstanding.length === 0

  const rootRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const [needsExpanded, setNeedsExpanded] = useState(false)

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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
            : 'logistics'
      setSectionErrors({ [section]: msg, publish: msg })
      scrollTo(first?.anchor ?? SECTION_ANCHOR[section])
      return
    }
    if (validity.openAudience) {
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

  return (
    <div className="concept-builder box-builder" ref={rootRef}>
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
          <h1 className="cb-page-title">Sampling box</h1>
          <p
            style={{
              margin: '8px 0 0',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink-50)',
            }}
          >
            {isImpersonating
              ? 'Building as the impersonated brand'
              : 'Ship real products to qualified users'}
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

      <nav className="cb-progress" aria-label="Box builder steps">
        {(
          [
            { id: BOX_ANCHORS.setup, label: 'Setup', done: validity.setupOk, active: !validity.setupOk },
            {
              id: BOX_ANCHORS.field,
              label: 'Contents',
              done: validity.setupOk && validity.fieldOk,
              active: validity.setupOk && !validity.fieldOk,
            },
            {
              id: BOX_ANCHORS.audience,
              label: 'Audience',
              done: validity.setupOk && validity.fieldOk && validity.audienceOk,
              active: validity.setupOk && validity.fieldOk && !validity.audienceOk,
            },
            {
              id: BOX_ANCHORS.logistics,
              label: 'Logistics',
              done: validity.readyToPublish,
              active:
                validity.setupOk &&
                validity.fieldOk &&
                validity.audienceOk &&
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

      <SetupSection
        draft={draft}
        onChange={persist}
        error={publishAttempted ? sectionErrors.setup : undefined}
        publishFailure={publishAttempted ? publishFailure : null}
      />

      <ContentsSection
        draft={draft}
        onChange={persist}
        focalL2NodeId={
          draft.fieldProducts.find((r) => r.product_id === draft.focalProductId)
            ?.l2_node_id ?? null
        }
        error={publishAttempted ? sectionErrors.field : undefined}
        publishFailure={publishAttempted ? publishFailure : null}
      />

      <BattleSection draft={draft} onChange={persist} />

      <AudienceSection
        draft={draft}
        onChange={persist}
        error={publishAttempted ? sectionErrors.audience : undefined}
      />

      <LogisticsSection
        draft={draft}
        onChange={persist}
        error={publishAttempted ? sectionErrors.logistics : undefined}
      />

      {sectionErrors.publish &&
      !sectionErrors.setup &&
      !sectionErrors.field &&
      !sectionErrors.audience &&
      !sectionErrors.logistics ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
          {sectionErrors.publish}
        </p>
      ) : null}

      {openAudienceConfirm ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="open-audience-title"
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
              id="open-audience-title"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink-80)',
                margin: '0 0 8px',
              }}
            >
              Publish with an open audience?
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}>
              No audience requirements are set — any user can claim a box, first come,
              first served, up to the unit count. Publishing opens the study immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setOpenAudienceConfirm(false)
                  scrollTo(BOX_ANCHORS.audience)
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
                Add requirements
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
          aria-labelledby="box-published-title"
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
              id="box-published-title"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink-80)',
                margin: '0 0 8px',
              }}
            >
              Box is live
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}>
              The study is open. Qualified users can claim it now — the field is
              frozen and the battle question is locked.
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
                  Products in box
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
                  Sessions
                </dt>
                <dd style={{ margin: 0 }}>
                  {publishMeta.session_count ?? '—'}
                  {publishMeta.session2_interval_hours
                    ? ` · ${publishMeta.session2_interval_hours}h apart`
                    : ''}
                </dd>
              </div>
              <div>
                <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
                  Status
                </dt>
                <dd style={{ margin: 0 }}>
                  {publishMeta.box_status === 'open' ? 'Open · claimable' : publishMeta.box_status ?? '—'}
                </dd>
              </div>
              <div>
                <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
                  Audience
                </dt>
                <dd style={{ margin: 0 }}>
                  {publishMeta.eligibility_applied ? 'Requirements applied' : 'Open'}
                </dd>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
                  Battle question
                </dt>
                <dd style={{ margin: 0, lineHeight: 1.4 }}>
                  {publishMeta.battle_question ?? BOX_DEFAULT_BATTLE_QUESTION}
                  {publishMeta.battle_question_is_custom ? (
                    <span style={{ color: 'var(--ink-50)', fontWeight: 500 }}>
                      {' '}
                      · custom
                    </span>
                  ) : (
                    <span style={{ color: 'var(--ink-50)', fontWeight: 500 }}>
                      {' '}
                      · default
                    </span>
                  )}
                </dd>
              </div>
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
                Back to studies
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                <p className="cb-dock-summary-help">
                  Publish opens the study so qualified users can claim it. Save draft
                  syncs across your devices.
                </p>
              </>
            ) : (
              <>
                <span className="cb-dock-summary-head">
                  <span className="cb-field-status-icon" data-tone="warn" aria-hidden>
                    !
                  </span>
                  Still needed
                </span>
                <p className="cb-dock-summary-help">Complete these to publish the box.</p>
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
              className="cb-btn cb-btn-primary"
              data-muted={!validity.readyToPublish || publishing}
              onClick={() => requestPublish()}
              disabled={publishing || pending || !!publishMeta}
            >
              {publishing ? 'Publishing…' : 'Publish box'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
