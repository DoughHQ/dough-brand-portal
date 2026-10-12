'use client'

import type { ConceptStudyDraft } from '@/lib/concept/types'
import BuilderSectionChrome from './BuilderSectionChrome'
import ConfirmDialog from './ConfirmDialog'
import { sectionHelp } from './conceptStyles'
import CategoryWording from './setup/CategoryWording'
import CompletionsRun from './setup/CompletionsRun'
import StudyNameField from './setup/StudyNameField'
import StudyTypeModes from './setup/StudyTypeModes'
import { useStudyTypeSection } from './setup/useStudyTypeSection'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  error?: string | null
  /** Publish-time blocker for the study name, which now lives in this section. */
  titleError?: string | null
  showErrors?: boolean
  /** @deprecated Always packaging-only; kept for call-site compatibility. */
  packagingOnly?: boolean
  /** Floor for target completions. */
  minCompletions?: number
}

export default function StudyTypeSection({
  draft,
  onChange,
  error,
  titleError,
  showErrors,
  packagingOnly = true,
  minCompletions = 30,
}: Props) {
  const setup = useStudyTypeSection({
    draft,
    onChange,
    packagingOnly,
    minCompletions,
  })

  return (
    <BuilderSectionChrome
      id="concept-mode"
      title="Setup"
      summary={setup.setupSummary}
      done={setup.sectionDone}
      className="cb-setup"
    >
      <p style={{ ...sectionHelp, marginBottom: 16 }}>
        Name the study, choose where it competes, and set how many responses you need.
      </p>

      <StudyTypeModes
        packagingOnly={packagingOnly}
        studyTypeLabelId={setup.studyTypeLabelId}
        liveModes={setup.liveModes}
        stimulusMode={draft.stimulusMode}
        onSelectMode={setup.selectMode}
      />

      {/* Beat 2 — the decisions */}
      <div className="cb-setup-decisions">
        <StudyNameField
          draft={draft}
          onChange={onChange}
          showErrors={showErrors}
          titleError={titleError}
        />

        <CategoryWording
          draft={draft}
          node={setup.node}
          hasCategory={setup.hasCategory}
          wordingOpen={setup.wordingOpen}
          setWordingOpen={setup.setWordingOpen}
          wording={setup.wording}
          setWording={setup.setWording}
          isDefaultWording={setup.isDefaultWording}
          onSelect={setup.applyCategory}
          onClear={setup.clearCategory}
          error={showErrors ? error : null}
        />

        {setup.showReadout ? (
          <p className="cb-setup-readout" role="status">
            {[setup.categoryLabel, setup.titleLabel].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>

      {/* Beat 3 — how it runs (completions only; end dates deferred) */}
      <CompletionsRun
        draft={draft}
        onChange={onChange}
        completionPresets={setup.completionPresets}
        completionFloor={setup.completionFloor}
        showCustomCompletions={setup.showCustomCompletions}
        completionsText={setup.completionsText}
        setCompletionsText={setup.setCompletionsText}
        setCustomCompletions={setup.setCustomCompletions}
        setCompletions={setup.setCompletions}
        completionsFocused={setup.completionsFocused}
        runMeta={setup.runMeta}
      />

      <ConfirmDialog request={setup.confirm} onCancel={() => setup.setConfirm(null)} />
    </BuilderSectionChrome>
  )
}
