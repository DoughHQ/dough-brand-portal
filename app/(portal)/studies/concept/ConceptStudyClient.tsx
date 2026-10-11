'use client'

import Link from 'next/link'
import CheckoutHandoff, { AwaitingPaymentNotice } from './CheckoutHandoff'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'
import AudienceSection from './AudienceSection'
import FieldSection from './FieldSection'
import SingleTestJourneySection from './SingleTestJourneySection'
import StudyTypeSection from './StudyTypeSection'
import StudyMasthead from './StudyMasthead'
import ResumeDraftBanner from '../components/ResumeDraftBanner'
import PublishingDock from '../components/PublishingDock'
import { formatResumeWhen } from '@/lib/studies/useServerStudyDraft'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import './conceptBuilder.css'
import ConceptStudyStepper from './client/ConceptStudyStepper'
import NoVerificationDialog from './client/NoVerificationDialog'
import { useConceptStudyClient } from './client/useConceptStudyClient'

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
  const study = useConceptStudyClient({ initialDraft, mode })

  return (
    <div className="concept-builder" ref={study.rootRef}>
      <header className="cb-page-head">
        <Link href="/studies" className="cb-back">
          ← Studies
        </Link>
        <h1 className="cb-page-title">{study.draft.title.trim() || 'Concept study'}</h1>
        <StudyMasthead
          draft={study.draft}
          locked={study.builderLocked}
          lockReason={study.lockReason}
          onOpenField={() => {
            if (study.builderLocked) {
              study.scrollToAnchor(CONCEPT_ANCHORS.mode)
              return
            }
            study.scrollToAnchor(CONCEPT_ANCHORS.field)
          }}
        />
      </header>

      {study.resumeOffer ? (
        <ResumeDraftBanner
          title={study.resumeOffer.title}
          whenLabel={formatResumeWhen(study.resumeOffer.updatedAt)}
          busy={study.resumeBusy}
          onResume={() => void study.acceptResume()}
          onStartFresh={study.dismissResume}
        />
      ) : null}

      {study.publishMeta && !study.handoffOpen ? (
        <AwaitingPaymentNotice onContinue={study.confirmPublished} />
      ) : null}

      <ConceptStudyStepper
        validity={study.validity}
        setupDone={study.setupDone}
        fieldDone={study.fieldDone}
        questionsDone={study.questionsDone}
      />

      {study.toast ? (
        <div
          role="status"
          style={{
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--heading)',
            background: 'var(--sage-soft)',
            border: '1px solid rgba(62, 107, 74, 0.2)',
            borderRadius: 'var(--r-md)',
            padding: '12px 16px',
          }}
        >
          {study.toast}
        </div>
      ) : null}

      {/* Study name moved into Section 0 (Pass 2). The `concept-study-name` id
          travels with the input, so the sticky-footer anchor is unchanged. */}
      <StudyTypeSection
        draft={study.draft}
        onChange={study.persist}
        error={study.sectionErrors.mode ?? null}
        titleError={study.sectionErrors.title ?? null}
        showErrors={study.publishAttempted}
        packagingOnly
        minCompletions={30}
      />

      <FieldSection
        draft={study.draft}
        onChange={study.persist}
        error={study.sectionErrors.field ?? null}
        publishFailure={study.publishFailure}
        disabled={study.builderLocked}
        disabledReason={study.builderLocked ? study.lockReason : null}
        singleTestMode
      />

      <SingleTestJourneySection
        draft={study.draft}
        onChange={study.persist}
        error={study.sectionErrors.questions ?? null}
        disabled={study.builderLocked}
        sectionDone={study.questionsDone}
        canPreview={study.validity.readyToPublish}
        onPreview={() => {
          study.flushSaveNow(study.draft)
          study.router.push(`/studies/concept/${study.draft.draftId}/preview`)
        }}
      />

      {STUDY_AUDIENCE_BUILDER_ENABLED ? (
        <AudienceSection
          draft={study.draft}
          onChange={study.persist}
          error={study.sectionErrors.audience ?? null}
          disabled={study.builderLocked}
          disabledReason={study.builderLocked ? study.lockReason : null}
        />
      ) : null}

      {study.sectionErrors.publish &&
      !study.sectionErrors.field &&
      !study.sectionErrors.questions &&
      !study.sectionErrors.audience &&
      !study.sectionErrors.mode ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
          {study.sectionErrors.publish}
        </p>
      ) : null}

      {study.noVerificationOpen ? (
        <NoVerificationDialog
          publishing={study.publishing}
          onAddBrands={study.addVerificationBrands}
          onPublish={() => void study.publishConfirmed()}
        />
      ) : null}

      {study.publishMeta && study.handoffOpen ? (
        <CheckoutHandoff
          draft={study.draft}
          meta={study.publishMeta}
          onClose={() => study.setHandoffOpen(false)}
          onContinue={study.confirmPublished}
        />
      ) : null}

      <PublishingDock
        stickyRef={study.stickyRef}
        ready={study.ready && canPublish}
        needs={study.stickyNeeds}
        readyFacts={study.readyFacts}
        saveStatus={study.saveStatus}
        saving={study.saving}
        publishing={study.publishing}
        actionsLocked={study.pending || study.handoffOpen || !canPublish}
        publishMuted={!canPublish || !study.validity.readyToPublish || study.publishing || !!study.publishMeta}
        publishDisabled={!!study.publishMeta}
        holdLabel={study.publishMeta ? 'Awaiting payment' : undefined}
        publishLabel={study.publishMeta ? 'Awaiting payment' : canPublish ? 'Publish study' : 'View only'}
        showPreview
        previewLabel="Preview"
        canPreview={study.validity.readyToPublish}
        onSave={study.saveDraft}
        onPublish={() => {
          if (!canPublish) return
          study.requestPublish()
        }}
        onPreview={() => {
          study.flushSaveNow(study.draft)
          study.router.push(`/studies/concept/${study.draft.draftId}/preview`)
        }}
        onScrollTo={study.scrollTo}
      />
    </div>
  )
}
