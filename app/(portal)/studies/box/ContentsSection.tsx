'use client'

import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS, type BoxPublishFailure } from '@/lib/box/validity'
import { summarizeBoxContents } from '@/lib/box/builderSummaries'
import { MAX_BOX_FIELD_SIZE } from '@/lib/box/fieldSize'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import ContentsAddActions from './contents/ContentsAddActions'
import ContentsComposer from './contents/ContentsComposer'
import ContentsEmptyState from './contents/ContentsEmptyState'
import ContentsSeatCard from './contents/ContentsSeatCard'
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
      <p style={helpStyle}>
        Two to five seats that ship in the box and battle each other. Add your catalog
        product, your prototype, or a competitor — then mark who is Yours.
      </p>

      {readiness ? (
        <p
          role="status"
          style={{
            margin: '0 0 16px',
            padding: '8px 12px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-10)',
            background: 'var(--surface-1)',
            fontSize: 12,
            color: 'var(--ink-70)',
            maxWidth: 640,
          }}
        >
          {readiness}
        </p>
      ) : null}

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
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {field.rows.map((row) => {
              if (field.composer?.replaceLocalId === row.localId) return null
              return (
                <ContentsSeatCard
                  key={row.localId}
                  row={row}
                  taxonomyNodeId={draft.taxonomyNodeId}
                  rowError={field.rowErrors[row.localId]}
                  onPatch={(next) => field.patchRow(row.localId, next)}
                  onOpenComposer={field.openComposer}
                  onRemove={() => field.removeRow(row.localId)}
                />
              )
            })}

            {field.composer ? (
              <ContentsComposer
                composer={field.composer}
                isEmpty={false}
                takenProducts={field.takenProducts}
                takenPrototypes={field.takenPrototypes}
                preferL2NodeId={preferL2NodeId}
                onOpenIntent={field.openComposer}
                onCancel={field.cancelComposer}
                onCatalogPick={field.addCatalog}
                onPrototypePick={field.addPrototype}
              />
            ) : null}
          </div>

          {!field.composer && field.canAdd ? (
            <ContentsAddActions
              onOpen={field.openComposer}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 16,
              }}
            />
          ) : null}

          {!field.composer && !field.canAdd ? (
            <p className="cb-field-note" style={{ margin: '16px 0 0' }}>
              Field full · {MAX_BOX_FIELD_SIZE} of {MAX_BOX_FIELD_SIZE}
            </p>
          ) : null}

          <p className="cb-field-note" style={{ marginTop: 12 }}>
            {field.rows.length} of {MAX_BOX_FIELD_SIZE} seat{field.rows.length === 1 ? '' : 's'} in the
            box
            {field.rows.length < 2 ? ' · at least 2 needed' : ''}
            {field.overBy > 0
              ? ` · remove ${field.overBy} to fit`
              : !field.canAdd && field.rows.length >= 2
                ? ' · full round-robin (10 battles)'
                : ''}
            {field.missingUpcCount > 0 ? ' · UPC required per catalog product' : ''}
            {field.unconfirmedCount > 0 ? ' · confirm each catalog product' : ''}
          </p>
        </>
      ) : null}

      {error ? (
        <p role="alert" style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </BuilderSectionChrome>
  )
}

const helpStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink-50)',
  margin: '0 0 24px',
  lineHeight: 1.45,
  maxWidth: 640,
}
