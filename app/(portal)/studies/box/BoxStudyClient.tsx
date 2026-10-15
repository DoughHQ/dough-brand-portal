'use client'

import Link from 'next/link'
import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS } from '@/lib/box/validity'
import SetupSection from './SetupSection'
import ContentsSection from './ContentsSection'
import MethodSection from './MethodSection'
import RiskSection from './RiskSection'
import AudienceSection from './AudienceSection'
import ResumeDraftBanner from '../components/ResumeDraftBanner'
import PublishingDock from '../components/PublishingDock'
import { formatResumeWhen } from '@/lib/studies/useServerStudyDraft'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import '../concept/conceptBuilder.css'
import BoxOpenAudienceDialog from './client/BoxOpenAudienceDialog'
import BoxPublishedDialog from './client/BoxPublishedDialog'
import BoxStudyStepper from './client/BoxStudyStepper'
import { useBoxStudyClient } from './client/useBoxStudyClient'

type Props = {
  initialDraft: BoxStudyDraft
  mode: 'new' | 'edit'
  isImpersonating: boolean
}

export default function BoxStudyClient({ initialDraft, mode, isImpersonating }: Props) {
  const study = useBoxStudyClient({ initialDraft, mode })

  return (
    <div className="concept-builder box-builder" ref={study.rootRef}>
      <header className="cb-page-head">
        <Link href="/studies" className="cb-back">
          ← Studies
        </Link>
        {study.draft.title.trim() ? <p className="cb-page-kicker">Sampling box</p> : null}
        <h1 className="cb-page-title">{study.draft.title.trim() || 'Sampling box'}</h1>
        {isImpersonating ? (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-50)' }}>
            Building as the impersonated brand
          </p>
        ) : null}
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

      <BoxStudyStepper validity={study.validity} />

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

      <SetupSection
        draft={study.draft}
        onChange={study.persist}
        error={
          study.publishAttempted
            ? study.sectionErrors.setup ?? study.sectionErrors.logistics
            : undefined
        }
        publishFailure={study.publishAttempted ? study.publishFailure : null}
        sectionDone={study.validity.setupOk}
      />

      <ContentsSection
        draft={study.draft}
        onChange={study.persist}
        preferL2NodeId={
          study.draft.fieldProducts.find((r) => r.role === 'yours' && r.l2_node_id != null)
            ?.l2_node_id ??
          study.draft.fieldProducts.find((r) => r.product_id === study.draft.focalProductId)
            ?.l2_node_id ??
          null
        }
        error={study.publishAttempted ? study.sectionErrors.field : undefined}
        publishFailure={study.publishAttempted ? study.publishFailure : null}
        sectionDone={study.validity.fieldOk}
      />

      <RiskSection
        draft={study.draft}
        onChange={study.persist}
        taxonomyRisk={study.taxonomyRisk}
        error={study.publishAttempted ? study.sectionErrors.risk : undefined}
        sectionDone={study.validity.riskOk}
      />

      <MethodSection
        draft={study.draft}
        onChange={study.persist}
        sectionDone={study.validity.setupOk && study.validity.fieldOk}
      />

      {STUDY_AUDIENCE_BUILDER_ENABLED ? (
        <AudienceSection
          draft={study.draft}
          onChange={study.persist}
          error={study.publishAttempted ? study.sectionErrors.audience : undefined}
          sectionDone={study.validity.audienceOk}
        />
      ) : null}

      {study.sectionErrors.publish &&
      !study.sectionErrors.setup &&
      !study.sectionErrors.field &&
      !study.sectionErrors.audience &&
      !study.sectionErrors.risk &&
      !study.sectionErrors.logistics ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
          {study.sectionErrors.publish}
        </p>
      ) : null}

      {STUDY_AUDIENCE_BUILDER_ENABLED && study.openAudienceConfirm ? (
        <BoxOpenAudienceDialog
          publishing={study.publishing}
          onAddRequirements={() => {
            study.setOpenAudienceConfirm(false)
            study.scrollTo(BOX_ANCHORS.audience)
          }}
          onPublish={() => void study.publishConfirmed()}
        />
      ) : null}

      {study.publishMeta ? (
        <BoxPublishedDialog
          publishMeta={study.publishMeta}
          onConfirm={study.confirmPublished}
        />
      ) : null}

      <PublishingDock
        stickyRef={study.stickyRef}
        ready={study.ready}
        readyFacts={study.readyFacts}
        needs={study.stickyNeeds}
        saveStatus={study.saveStatus}
        saving={study.saving}
        publishing={study.publishing}
        actionsLocked={study.pending || !!study.publishMeta}
        publishMuted={!study.validity.readyToPublish || study.publishing}
        publishLabel="Publish box"
        showPreview
        previewLabel="Preview"
        canPreview={study.validity.setupOk && study.validity.fieldOk}
        onPreview={() => study.router.push(`/studies/box/${study.draft.draftId}/preview`)}
        onSave={study.saveDraft}
        onPublish={() => study.requestPublish()}
        onScrollTo={study.scrollTo}
      />
    </div>
  )
}
