'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BoxFieldRow, BoxSeatRole, BoxStudyDraft } from '@/lib/box/types'
import type { AdminProductSearchResult } from '@/lib/queries'
import type { PrototypeListItem, PrototypePackaging } from '@/lib/prototypes/types'
import {
  BOX_ANCHORS,
  boxFieldRowErrors,
  type BoxPublishFailure,
} from '@/lib/box/validity'
import { summarizeBoxContents } from '@/lib/box/builderSummaries'
import { createEmptyBoxFieldRow } from '@/lib/box/defaults'
import {
  applyPrototypeToSeat,
  createPrototypeSeatFromItem,
} from '@/lib/box/applyPrototypeSeat'
import { hydrateBoxFieldRow } from '@/lib/box/hydrate'
import { BOX_UPC_SCAN_HELP } from '@/lib/box/constants'
import {
  canAddBoxProduct,
  isResolvedBoxSeat,
  MAX_BOX_FIELD_SIZE,
} from '@/lib/box/fieldSize'
import { categoryFromSearchResult, isIdentityConfirmed } from '@/lib/productEntryMode'
import { createClient } from '@/lib/supabase'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import BoxProductSearchSlot from './BoxProductSearchSlot'
import BoxPrototypePickSlot from './BoxPrototypePickSlot'
import BoxUpcField from './BoxUpcField'
import BoxAllergenConfirm from './BoxAllergenConfirm'
import ProductIdentityConfirm from '../ProductIdentityConfirm'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  preferL2NodeId?: number | null
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  sectionDone?: boolean
}

type ComposerIntent = 'yours_catalog' | 'yours_prototype' | 'competitor_catalog'

/** Transient add/replace — never written into the draft until resolved. */
type Composer =
  | null
  | {
      intent: ComposerIntent
      replaceLocalId?: string
      previous?: BoxFieldRow
    }

function catalogSeatFromPick(
  p: AdminProductSearchResult,
  role: BoxSeatRole,
  knownUpc?: string
): BoxFieldRow {
  return {
    ...createEmptyBoxFieldRow(),
    kind: 'product',
    role,
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
}

export default function ContentsSection({
  draft,
  onChange,
  preferL2NodeId = null,
  error,
  publishFailure = null,
  sectionDone = false,
}: Props) {
  const [composer, setComposer] = useState<Composer>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const prunedRef = useRef(false)

  useEffect(() => {
    if (prunedRef.current) return
    const dirty = draft.fieldProducts.some((r) => !isResolvedBoxSeat(r))
    if (!dirty) {
      prunedRef.current = true
      return
    }
    prunedRef.current = true
    onChange({
      ...draft,
      fieldProducts: draft.fieldProducts.filter(isResolvedBoxSeat),
    })
  }, [draft, onChange])

  const rows = useMemo(
    () => draft.fieldProducts.filter(isResolvedBoxSeat),
    [draft.fieldProducts]
  )
  const yoursRows = useMemo(() => rows.filter((r) => r.role === 'yours'), [rows])
  const competitorRows = useMemo(
    () => rows.filter((r) => r.role !== 'yours'),
    [rows]
  )

  const takenProducts = useMemo(
    () =>
      new Set(
        rows
          .map((r) => r.product_id)
          .filter((id): id is number => id != null)
          .map(String)
      ),
    [rows]
  )
  const takenPrototypes = useMemo(
    () => new Set(rows.map((r) => r.prototype_id).filter((id): id is string => !!id)),
    [rows]
  )
  const rowErrors = useMemo(
    () => boxFieldRowErrors(draft, publishFailure),
    [draft, publishFailure]
  )

  const canAdd = canAddBoxProduct(draft)
  const overBy = Math.max(0, rows.length - MAX_BOX_FIELD_SIZE)
  const missingUpcCount = rows.filter(
    (r) => r.kind !== 'prototype' && r.product_id != null && !r.upc?.trim()
  ).length
  const unconfirmedCount = rows.filter(
    (r) =>
      r.kind !== 'prototype' &&
      r.product_id != null &&
      !!r.upc?.trim() &&
      !isIdentityConfirmed(r)
  ).length

  const composerIsYours =
    composer?.intent === 'yours_catalog' || composer?.intent === 'yours_prototype'
  const composerIsCompetitor = composer?.intent === 'competitor_catalog'
  const composerIsCatalog =
    composer?.intent === 'yours_catalog' || composer?.intent === 'competitor_catalog'
  const composerIsPrototype = composer?.intent === 'yours_prototype'

  function commitRows(nextRows: BoxFieldRow[], extra?: Partial<BoxStudyDraft>) {
    const current = draftRef.current
    let taxonomyNodeId = extra?.taxonomyNodeId ?? current.taxonomyNodeId
    if (taxonomyNodeId == null) {
      const seed = nextRows.find(
        (r) => r.role === 'yours' && r.taxonomy_node_id != null
      )
      if (seed?.taxonomy_node_id != null) taxonomyNodeId = seed.taxonomy_node_id
    }
    const yoursCatalog = nextRows.find(
      (r) => r.role === 'yours' && r.kind !== 'prototype' && r.product_id != null
    )
    onChange({
      ...current,
      ...extra,
      taxonomyNodeId,
      focalProductId: yoursCatalog?.product_id ?? current.focalProductId,
      fieldProducts: nextRows,
    })
  }

  function patchRow(localId: string, next: BoxFieldRow) {
    commitRows(
      draftRef.current.fieldProducts.map((r) => (r.localId === localId ? next : r))
    )
  }

  function openComposer(intent: ComposerIntent, replace?: BoxFieldRow) {
    if (!replace && !canAddBoxProduct(draftRef.current)) return
    setComposer({
      intent,
      replaceLocalId: replace?.localId,
      previous: replace,
    })
  }

  function cancelComposer() {
    if (composer?.previous && composer.replaceLocalId) {
      patchRow(composer.replaceLocalId, composer.previous)
    }
    setComposer(null)
  }

  function upsertResolved(row: BoxFieldRow) {
    const current = draftRef.current
    if (composer?.replaceLocalId) {
      commitRows(
        current.fieldProducts.map((r) =>
          r.localId === composer.replaceLocalId
            ? { ...row, localId: composer.replaceLocalId, role: row.role }
            : r
        )
      )
    } else {
      commitRows([...current.fieldProducts.filter(isResolvedBoxSeat), row])
    }
    setComposer(null)
  }

  function addCatalog(p: AdminProductSearchResult, knownUpc?: string) {
    if (!composer) return
    const role: BoxSeatRole =
      composer.intent === 'competitor_catalog' ? 'competitor' : 'yours'
    // Column owns role on fresh adds; Change keeps the seat's prior role unless
    // the operator explicitly switched columns via the other intent.
    const row = catalogSeatFromPick(
      p,
      composer.replaceLocalId ? role : role,
      knownUpc
    )
    const provisionalLocalId = composer.replaceLocalId ?? row.localId
    const withId = { ...row, localId: provisionalLocalId, role }
    upsertResolved(withId)
    void hydrateBoxFieldRow(createClient(), withId, p, knownUpc).then((hydrated) => {
      if (draftRef.current.fieldProducts.some((r) => r.localId === provisionalLocalId)) {
        patchRow(provisionalLocalId, {
          ...hydrated,
          localId: provisionalLocalId,
          kind: 'product',
          role,
        })
      }
    })
  }

  function addPrototype(item: PrototypeListItem, imageUrl: string | null) {
    if (!composer) return
    const role: BoxSeatRole = 'yours'
    const row =
      composer.replaceLocalId && composer.previous
        ? applyPrototypeToSeat(composer.previous, item, { imageUrl, role })
        : createPrototypeSeatFromItem(item, { imageUrl, role })
    if (composer.replaceLocalId) {
      upsertResolved({ ...row, localId: composer.replaceLocalId, role })
    } else {
      upsertResolved({ ...row, role })
    }
  }

  function removeRow(localId: string) {
    const current = draftRef.current
    const removed = current.fieldProducts.find((r) => r.localId === localId)
    const nextRows = current.fieldProducts.filter((r) => r.localId !== localId)
    commitRows(nextRows, {
      focalProductId:
        removed?.product_id != null && removed.product_id === current.focalProductId
          ? null
          : current.focalProductId,
    })
    if (composer?.replaceLocalId === localId) setComposer(null)
  }

  function renderComposerPanel(side: 'yours' | 'competitor') {
    if (!composer) return null
    if (side === 'yours' && !composerIsYours) return null
    if (side === 'competitor' && !composerIsCompetitor) return null

    if (composerIsCatalog) {
      return (
        <div
          style={{
            border: '1px dashed var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: 14,
            background: 'var(--surface-1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 10,
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-80)' }}>
              {composer.replaceLocalId
                ? 'Replace with a product'
                : side === 'competitor'
                  ? 'Add a competitor'
                  : 'Add your product'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {side === 'yours' && !composer.replaceLocalId ? (
                <button
                  type="button"
                  className="cb-quiet-action"
                  onClick={() => openComposer('yours_prototype')}
                >
                  Use a prototype instead
                </button>
              ) : null}
              <button type="button" className="cb-quiet-action" onClick={cancelComposer}>
                Cancel
              </button>
            </div>
          </div>
          <BoxProductSearchSlot
            taken={takenProducts}
            onPick={addCatalog}
            onCancel={cancelComposer}
            preferL2NodeId={preferL2NodeId}
            entryModes
            placeholder={
              side === 'competitor'
                ? 'Search competitors by name, brand, or barcode…'
                : 'Search your product by name, brand, or barcode…'
            }
          />
        </div>
      )
    }

    if (composerIsPrototype) {
      return (
        <div
          style={{
            border: '1px dashed var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: 14,
            background: 'var(--surface-1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 10,
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-80)' }}>
              {composer.replaceLocalId
                ? 'Replace with a prototype'
                : 'Add your prototype'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!composer.replaceLocalId ? (
                <button
                  type="button"
                  className="cb-quiet-action"
                  onClick={() => openComposer('yours_catalog')}
                >
                  Use a product instead
                </button>
              ) : null}
              <button type="button" className="cb-quiet-action" onClick={cancelComposer}>
                Cancel
              </button>
            </div>
          </div>
          <BoxPrototypePickSlot
            taken={takenPrototypes}
            onPick={addPrototype}
            onCancel={cancelComposer}
          />
        </div>
      )
    }
    return null
  }

  function renderSeatCard(r: BoxFieldRow) {
    if (composer?.replaceLocalId === r.localId) return null
    const isYours = r.role === 'yours'
    const isPrototype = r.kind === 'prototype'
    const differentCategory =
      r.taxonomy_node_id != null &&
      draft.taxonomyNodeId != null &&
      r.taxonomy_node_id !== draft.taxonomyNodeId
    const rowError = rowErrors[r.localId]
    const awaitingConfirm =
      !isPrototype && !!r.upc?.trim() && !isIdentityConfirmed(r)

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
          background: isYours ? 'var(--cream)' : 'var(--white)',
          marginBottom: 12,
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
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 6,
              alignItems: 'center',
            }}
          >
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
              }}
            >
              {isPrototype ? 'Prototype' : 'Catalog'}
            </span>
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
                }}
              >
                Different category
              </span>
            ) : null}
          </div>
          <div style={{ fontWeight: 600, color: 'var(--ink-80)', fontSize: 15 }}>
            {r.frozen_display_name || 'Unnamed'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 2 }}>
            {isPrototype
              ? [
                  r.packaging === 'plain_sample' ? 'Plain sample' : 'Final packaging',
                  r.frozen_category,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : r.frozen_brand_name}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 10,
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              className="cb-quiet-action"
              onClick={() =>
                openComposer(
                  isPrototype
                    ? 'yours_prototype'
                    : isYours
                      ? 'yours_catalog'
                      : 'competitor_catalog',
                  r
                )
              }
            >
              Change
            </button>
            {isYours && !isPrototype ? (
              <button
                type="button"
                className="cb-quiet-action"
                onClick={() => openComposer('yours_prototype', r)}
              >
                Use prototype instead
              </button>
            ) : null}
            {isYours && isPrototype ? (
              <button
                type="button"
                className="cb-quiet-action"
                onClick={() => openComposer('yours_catalog', r)}
              >
                Use product instead
              </button>
            ) : null}
            <button
              type="button"
              className="cb-quiet-action"
              onClick={() =>
                patchRow(r.localId, {
                  ...r,
                  role: isYours ? 'competitor' : 'yours',
                })
              }
            >
              {isYours ? 'Move to competitors' : 'Move to yours'}
            </button>
            <button
              type="button"
              className="cb-quiet-action"
              onClick={() => removeRow(r.localId)}
              aria-label={`Remove ${r.frozen_display_name || 'seat'}`}
            >
              Remove
            </button>
          </div>

          {isPrototype ? (
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                Packaging{' '}
                <select
                  value={
                    r.packaging === 'plain_sample' ? 'plain_sample' : 'final_packaging'
                  }
                  onChange={(e) => {
                    const packaging: PrototypePackaging =
                      e.target.value === 'plain_sample'
                        ? 'plain_sample'
                        : 'final_packaging'
                    patchRow(r.localId, { ...r, packaging })
                  }}
                >
                  <option value="final_packaging">Final packaging</option>
                  <option value="plain_sample">Plain sample</option>
                </select>
              </label>
              <label style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                Shelf price (optional){' '}
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 3.49"
                  value={r.price ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.trim()
                    if (!raw) {
                      patchRow(r.localId, { ...r, price: null })
                      return
                    }
                    const n = Number(raw)
                    patchRow(r.localId, {
                      ...r,
                      price: Number.isFinite(n) && n > 0 ? n : null,
                    })
                  }}
                  style={{
                    marginLeft: 6,
                    width: 96,
                    fontSize: 13,
                    padding: '4px 8px',
                    border: '1px solid var(--ink-10)',
                    borderRadius: 6,
                  }}
                />
              </label>
            </div>
          ) : awaitingConfirm && r.upc ? (
            <div style={{ marginTop: 12 }}>
              <ProductIdentityConfirm
                name={r.frozen_display_name}
                brand={r.frozen_brand_name}
                category={r.frozen_category ?? null}
                upc={r.upc}
                help={BOX_UPC_SCAN_HELP}
                onConfirm={() =>
                  patchRow(r.localId, {
                    ...r,
                    identityConfirmed: true,
                    allergensContains: null,
                    allergensMayContain: null,
                    allergensConfirmed: false,
                    allergensCatalogStatus: null,
                  })
                }
                onChange={() =>
                  openComposer(isYours ? 'yours_catalog' : 'competitor_catalog', r)
                }
              />
            </div>
          ) : r.product_id != null ? (
            <div style={{ marginTop: 12 }}>
              <BoxUpcField
                row={r}
                onSelectUpc={(upc) =>
                  patchRow(r.localId, {
                    ...r,
                    upc,
                    identityConfirmed: isYours,
                    allergensContains: null,
                    allergensMayContain: null,
                    allergensConfirmed: false,
                    allergensCatalogStatus: null,
                  })
                }
                error={rowError}
              />
              {isIdentityConfirmed(r) && r.upc?.trim() ? (
                <BoxAllergenConfirm
                  row={r}
                  onChange={(next) => patchRow(r.localId, next)}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.field}
      title="Build the field"
      summary={summarizeBoxContents(draft)}
      done={sectionDone}
      className="cb-field-section"
    >
      <p style={helpStyle}>
        Two to five seats that ship and battle. Add what&rsquo;s yours on the left,
        then the catalog competitors shoppers would compare it against.
      </p>

      <div className="cb-field-grid">
        <div className="cb-field-head-left">
          <div className="cb-field-col-title">Yours</div>
          <div className="cb-field-col-meta">
            Your product or a ready prototype from the library.
          </div>
        </div>
        <div className="cb-field-head-right">
          <div className="cb-field-col-title">Competitors</div>
          <div className="cb-field-col-meta">
            Real catalog products that complete the purchase decision.
          </div>
        </div>

        <div className="cb-field-body-left">
          {yoursRows.length === 0 && !composerIsYours ? (
            <div
              style={{
                border: 'var(--cb-border-dashed)',
                borderRadius: 'var(--r-lg)',
                background: 'var(--cb-surface-muted)',
                padding: '28px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--ink-80)',
                  marginBottom: 8,
                }}
              >
                Add what&rsquo;s yours
              </div>
              <p
                style={{
                  margin: '0 auto 16px',
                  maxWidth: 260,
                  fontSize: 13,
                  color: 'var(--ink-50)',
                  lineHeight: 1.45,
                }}
              >
                A live catalog SKU or a private prototype sample.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  className="cb-btn cb-btn-secondary"
                  disabled={!canAdd}
                  onClick={() => openComposer('yours_catalog')}
                >
                  + Your product
                </button>
                <button
                  type="button"
                  className="cb-btn cb-btn-secondary"
                  disabled={!canAdd}
                  onClick={() => openComposer('yours_prototype')}
                >
                  + Your prototype
                </button>
              </div>
            </div>
          ) : (
            <>
              {yoursRows.map(renderSeatCard)}
              {renderComposerPanel('yours')}
              {!composerIsYours && canAdd ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    type="button"
                    className="cb-btn cb-btn-secondary"
                    onClick={() => openComposer('yours_catalog')}
                  >
                    + Your product
                  </button>
                  <button
                    type="button"
                    className="cb-btn cb-btn-secondary"
                    onClick={() => openComposer('yours_prototype')}
                  >
                    + Your prototype
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="cb-field-body-right">
          {competitorRows.length === 0 && !composerIsCompetitor ? (
            <div
              style={{
                border: 'var(--cb-border-dashed)',
                borderRadius: 'var(--r-lg)',
                background: 'var(--cb-surface-muted)',
                padding: '28px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--ink-80)',
                  marginBottom: 8,
                }}
              >
                Add competitors
              </div>
              <p
                style={{
                  margin: '0 auto 16px',
                  maxWidth: 280,
                  fontSize: 13,
                  color: 'var(--ink-50)',
                  lineHeight: 1.45,
                }}
              >
                Search Dough&rsquo;s catalog for the products shoppers would see as
                alternatives.
              </p>
              <button
                type="button"
                className="cb-btn cb-btn-secondary"
                disabled={!canAdd}
                onClick={() => openComposer('competitor_catalog')}
              >
                + Competitor product
              </button>
            </div>
          ) : (
            <>
              {competitorRows.map(renderSeatCard)}
              {renderComposerPanel('competitor')}
              {!composerIsCompetitor && canAdd ? (
                <button
                  type="button"
                  className="cb-btn cb-btn-secondary"
                  onClick={() => openComposer('competitor_catalog')}
                >
                  + Competitor product
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      <p className="cb-field-note" style={{ marginTop: 16 }}>
        {rows.length} of {MAX_BOX_FIELD_SIZE} seat{rows.length === 1 ? '' : 's'} in the box
        {rows.length < 2 ? ' · at least 2 needed' : ''}
        {yoursRows.length === 0 && rows.length > 0 ? ' · mark at least one as Yours' : ''}
        {overBy > 0
          ? ` · remove ${overBy} to fit`
          : !canAdd && rows.length >= 2
            ? ' · full round-robin (10 battles)'
            : ''}
        {missingUpcCount > 0 ? ' · UPC required per catalog product' : ''}
        {unconfirmedCount > 0 ? ' · confirm each catalog product' : ''}
      </p>

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
  maxWidth: 720,
}
