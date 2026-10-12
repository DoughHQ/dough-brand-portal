'use client'

import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS, type BoxPublishFailure } from '@/lib/box/validity'
import { summarizeBoxSetup } from '@/lib/box/builderSummaries'
import { PRODUCT_NAME } from '@/lib/brand'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import BoxCategoryField from './setup/BoxCategoryField'
import BoxRunSection from './setup/BoxRunSection'
import BoxStudyNameField from './setup/BoxStudyNameField'
import { helpStyle } from './setup/setupStyles'
import { useBoxSetup } from './setup/useBoxSetup'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  /** When true, the section collapses (parent owns identity + scale validity). */
  sectionDone?: boolean
}

/**
 * Setup mirrors concept: identity plus the result the brand buys. Dough owns
 * inventory overage, respondent-relative timing, and the hidden safety window.
 */
export default function SetupSection({
  draft,
  onChange,
  error,
  sectionDone = false,
}: Props) {
  const setup = useBoxSetup(draft.taxonomyNodeId)

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.setup}
      title="Setup"
      summary={summarizeBoxSetup(draft)}
      done={sectionDone}
    >
      <p style={helpStyle}>
        Name the study, pick the category, and choose the completed responses
        your report needs. {PRODUCT_NAME} handles inventory and timing.
      </p>

      <BoxStudyNameField draft={draft} onChange={onChange} />
      <BoxCategoryField
        draft={draft}
        node={setup.node}
        setNode={setup.setNode}
        onChange={onChange}
        error={error}
      />
      <BoxRunSection draft={draft} onChange={onChange} />

      {error ? (
        <p role="alert" style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </BuilderSectionChrome>
  )
}
