'use client'

import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS, type BoxPublishFailure } from '@/lib/box/validity'
import { summarizeBoxContents } from '@/lib/box/builderSummaries'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import ContentsComposer from './contents/ContentsComposer'
import ContentsEmptyState from './contents/ContentsEmptyState'
import ContentsFieldAlert from './contents/ContentsFieldAlert'
import ContentsFieldIntro from './contents/ContentsFieldIntro'
import ContentsOccupiedField from './contents/ContentsOccupiedField'
import ContentsReadinessNote from './contents/ContentsReadinessNote'
import { priceReadinessLabel } from './contents/priceReadiness'
import { useContentsField } from './contents/useContentsField'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  /** Prefer same-area catalog picks when set. */
  preferL2NodeId?: number | null
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  sectionDone?: boolean
}

export default function ContentsSection({
  draft,
  onChange,
  preferL2NodeId = null,
  error,
  publishFailure = null,
  sectionDone = false,
}: Props) {
  const field = useContentsField({ draft, onChange, publishFailure })
  const readiness = priceReadinessLabel(draft)

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.field}
      title="Build the field"
      summary={summarizeBoxContents(draft)}
      done={sectionDone}
    >
      <ContentsFieldIntro />
      <ContentsReadinessNote readiness={readiness} />

      {field.isEmpty && !field.composer ? (
        <ContentsEmptyState onOpen={field.openComposer} />
      ) : null}

      {field.isEmpty && field.composer ? (
        <div style={{ marginTop: 4 }}>
          <ContentsComposer
            composer={field.composer}
            isEmpty
            takenProducts={field.takenProducts}
            takenPrototypes={field.takenPrototypes}
            preferL2NodeId={preferL2NodeId}
            onOpenIntent={field.openComposer}
            onCancel={field.cancelComposer}
            onCatalogPick={field.addCatalog}
            onPrototypePick={field.addPrototype}
          />
        </div>
      ) : null}

      {!field.isEmpty ? (
        <ContentsOccupiedField
          rows={field.rows}
          composer={field.composer}
          taxonomyNodeId={draft.taxonomyNodeId}
          rowErrors={field.rowErrors}
          takenProducts={field.takenProducts}
          takenPrototypes={field.takenPrototypes}
          preferL2NodeId={preferL2NodeId}
          canAdd={field.canAdd}
          overBy={field.overBy}
          missingUpcCount={field.missingUpcCount}
          unconfirmedCount={field.unconfirmedCount}
          openComposer={field.openComposer}
          cancelComposer={field.cancelComposer}
          addCatalog={field.addCatalog}
          addPrototype={field.addPrototype}
          removeRow={field.removeRow}
          patchRow={field.patchRow}
        />
      ) : null}

      <ContentsFieldAlert error={error ?? null} />
    </BuilderSectionChrome>
  )
}
