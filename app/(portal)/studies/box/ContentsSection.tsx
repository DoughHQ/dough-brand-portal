'use client'

import { useMemo, useRef, useState } from 'react'
import type { BoxFieldRow, BoxStudyDraft } from '@/lib/box/types'
import type { AdminProductSearchResult } from '@/lib/queries'
import {
  BOX_ANCHORS,
  boxFieldRowErrors,
  type BoxPublishFailure,
} from '@/lib/box/validity'
import { summarizeBoxContents } from '@/lib/box/builderSummaries'
import { createEmptyBoxFieldRow } from '@/lib/box/defaults'
import { hydrateBoxFieldRow } from '@/lib/box/hydrate'
import { BOX_UPC_SCAN_HELP } from '@/lib/box/constants'
import { canAddBoxProduct, MAX_BOX_FIELD_SIZE } from '@/lib/box/fieldSize'
import { categoryFromSearchResult, isIdentityConfirmed } from '@/lib/productEntryMode'
import { createClient } from '@/lib/supabase'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import BoxProductSearchSlot from './BoxProductSearchSlot'
import BoxUpcField from './BoxUpcField'
import ProductIdentityConfirm from '../ProductIdentityConfirm'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  /** L2 node id of the focal, to encourage same-area picks. */
  focalL2NodeId?: number | null
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  sectionDone?: boolean
}

export default function ContentsSection({
  draft,
  onChange,
  focalL2NodeId = null,
  error,
  publishFailure = null,
  sectionDone = false,
}: Props) {
  const [adding, setAdding] = useState(false)
  const draftRef = useRef(draft)
  draftRef.current = draft

  const rows = draft.fieldProducts
  const taken = useMemo(
    () =>
      new Set(
        rows
          .map((r) => r.product_id)
          .filter((id): id is number => id != null)
          .map(String)
      ),
    [rows]
  )
  const rowErrors = useMemo(
    () => boxFieldRowErrors(draft, publishFailure),
    [draft, publishFailure]
  )

  function patchRow(localId: string, next: BoxFieldRow) {
    const current = draftRef.current
    onChange({
      ...current,
      fieldProducts: current.fieldProducts.map((r) =>
        r.localId === localId ? next : r
      ),
    })
  }

  function addProduct(p: AdminProductSearchResult, knownUpc?: string) {
    if (!canAddBoxProduct(draftRef.current)) {
      setAdding(false)
      return
    }
    const row: BoxFieldRow = {
      ...createEmptyBoxFieldRow(),
      product_id: p.product_id,
      frozen_display_name: p.product_name_clean,
      frozen_brand_name: p.brand_name,
      frozen_image_url: p.image_url ?? null,
      taxonomy_node_id: p.taxonomy_node_id ?? null,
      l2_node_id: p.l2_node_id ?? null,
      frozen_category: categoryFromSearchResult(p),
      upc: knownUpc?.trim() || null,
      identityConfirmed: false,
    }
    const current = draftRef.current
    onChange({ ...current, fieldProducts: [...current.fieldProducts, row] })
    setAdding(false)
    void hydrateBoxFieldRow(createClient(), row, p, knownUpc).then((hydrated) => {
      if (draftRef.current.fieldProducts.some((r) => r.localId === row.localId)) {
        patchRow(row.localId, hydrated)
      }
    })
  }

  function removeRow(localId: string, productId: number | null) {
    if (productId != null && productId === draft.focalProductId) return // focal must ship
    onChange({
      ...draftRef.current,
      fieldProducts: draftRef.current.fieldProducts.filter((r) => r.localId !== localId),
    })
  }

  const resolvedCount = rows.filter((r) => r.product_id != null).length
  const missingUpcCount = rows.filter(
    (r) => r.product_id != null && !r.upc?.trim()
  ).length
  const unconfirmedCount = rows.filter(
    (r) => r.product_id != null && !!r.upc?.trim() && !isIdentityConfirmed(r)
  ).length
  const canAdd = canAddBoxProduct(draft)
  const overBy = Math.max(0, rows.length - MAX_BOX_FIELD_SIZE)

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.field}
      title="Build the field"
      summary={summarizeBoxContents(draft)}
      done={sectionDone}
    >
      <p style={helpStyle}>
        Everything that ships, hero included. They battle each other after tasting, so
        the field should be a real purchase decision — usually the same category.
      </p>

      {draft.focalProductId == null ? (
        <div
          className="cb-locked-panel"
          role="status"
          style={{
            border: '1px dashed var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: 20,
            color: 'var(--ink-50)',
            fontSize: 14,
          }}
        >
          Choose a hero product in Setup to start filling the box.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((r) => {
              const isFocal =
                r.product_id != null && r.product_id === draft.focalProductId
              const differentCategory =
                r.taxonomy_node_id != null &&
                draft.taxonomyNodeId != null &&
                r.taxonomy_node_id !== draft.taxonomyNodeId
              const rowError = rowErrors[r.localId]
              const awaitingConfirm =
                !isFocal && !!r.upc?.trim() && !isIdentityConfirmed(r)
              return (
                <div
                  key={r.localId}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    border: `1px solid ${rowError ? 'var(--red)' : 'var(--ink-10)'}`,
                    borderRadius: 'var(--r-md)',
                    padding: 14,
                    background: isFocal ? 'var(--cream)' : 'var(--white)',
                  }}
                >
                  {r.frozen_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.frozen_image_url}
                      alt=""
                      width={72}
                      height={72}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: 'contain',
                        background: 'var(--surface-1)',
                        borderRadius: 10,
                        flexShrink: 0,
                        border: '1px solid var(--ink-10)',
                      }}
                    />
                  ) : (
                    <span
                      aria-hidden
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        background: 'var(--surface-1)',
                        border: '1px solid var(--ink-10)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink-80)', fontSize: 15 }}>
                      {r.frozen_display_name || 'Unnamed product'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 2 }}>
                      {r.frozen_brand_name}
                    </div>
                    {awaitingConfirm && r.upc ? (
                      <ProductIdentityConfirm
                        name={r.frozen_display_name}
                        brand={r.frozen_brand_name}
                        category={r.frozen_category ?? null}
                        upc={r.upc}
                        help={BOX_UPC_SCAN_HELP}
                        onConfirm={() =>
                          patchRow(r.localId, { ...r, identityConfirmed: true })
                        }
                        onChange={() => {
                          removeRow(r.localId, r.product_id)
                          setAdding(true)
                        }}
                      />
                    ) : r.product_id != null ? (
                      <div style={{ marginTop: 12 }}>
                        <BoxUpcField
                          row={r}
                          onSelectUpc={(upc) =>
                            patchRow(r.localId, {
                              ...r,
                              upc,
                              identityConfirmed: isFocal,
                            })
                          }
                          error={rowError}
                        />
                      </div>
                    ) : null}
                  </div>
                  {differentCategory ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-50)',
                        background: 'var(--surface-1)',
                        borderRadius: 'var(--cb-radius-pill)',
                        padding: '3px 8px',
                        flexShrink: 0,
                      }}
                    >
                      Different category
                    </span>
                  ) : null}
                  {isFocal ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--sage)',
                        background: 'var(--sage-soft)',
                        borderRadius: 'var(--cb-radius-pill)',
                        padding: '3px 8px',
                        flexShrink: 0,
                      }}
                    >
                      Hero
                    </span>
                  ) : awaitingConfirm ? null : (
                    <button
                      type="button"
                      className="cb-quiet-action"
                      onClick={() => removeRow(r.localId, r.product_id)}
                      aria-label={`Remove ${r.frozen_display_name}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            {adding && canAdd ? (
              <BoxProductSearchSlot
                taken={taken}
                onPick={addProduct}
                onCancel={() => setAdding(false)}
                preferL2NodeId={focalL2NodeId}
                entryModes
                placeholder="Add another product by name, brand, or barcode…"
              />
            ) : canAdd ? (
              <button
                type="button"
                className="cb-btn cb-btn-secondary"
                onClick={() => setAdding(true)}
              >
                + Add product
              </button>
            ) : (
              <p className="cb-field-note" style={{ margin: 0 }}>
                Field full · {MAX_BOX_FIELD_SIZE} of {MAX_BOX_FIELD_SIZE}
              </p>
            )}
          </div>

          <p className="cb-field-note" style={{ marginTop: 12 }}>
            {resolvedCount} of {MAX_BOX_FIELD_SIZE} product{resolvedCount === 1 ? '' : 's'} in the box
            {resolvedCount < 2 ? ' · at least 2 needed' : ''}
            {overBy > 0
              ? ` · remove ${overBy} to fit`
              : !canAdd && resolvedCount >= 2
                ? ' · full round-robin (10 battles)'
                : ''}
            {missingUpcCount > 0 ? ' · UPC required per product' : ''}
            {unconfirmedCount > 0 ? ' · confirm each product' : ''}
          </p>
        </>
      )}

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
