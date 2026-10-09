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
  /** Prefer same-area catalog picks when set. */
  preferL2NodeId?: number | null
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  sectionDone?: boolean
}

/** Transient add/replace — never written into the draft until resolved. */
type Composer =
  | null
  | {
      intent: 'yours_catalog' | 'yours_prototype' | 'competitor_catalog'
      replaceLocalId?: string
      /** Snapshot so Change can cancel without data loss. */
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

function ShelfPriceInput({
  value,
  onChange,
}: {
  value: number | null
  onChange: (price: number | null) => void
}) {
  return (
    <label style={{ fontSize: 12, color: 'var(--ink-50)' }}>
      Shelf price{' '}
      <input
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        placeholder="e.g. 3.49"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value.trim()
          if (!raw) {
            onChange(null)
            return
          }
          const n = Number(raw)
          onChange(Number.isFinite(n) && n > 0 ? n : null)
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
      <span style={{ display: 'block', marginTop: 4, color: 'var(--ink-40)' }}>
        Required on every packaged seat to enable tested-offer price checks.
      </span>
    </label>
  )
}

function priceReadinessLabel(draft: BoxStudyDraft): string | null {
  const seats = draft.fieldProducts.filter(isResolvedBoxSeat)
  if (seats.length < 2) return null
  if (seats.some((r) => r.packaging === 'plain_sample')) {
    return 'Taste-only box — price checks off'
  }
  const priced = seats.every(
    (r) => typeof r.price === 'number' && Number.isFinite(r.price) && r.price > 0
  )
  return priced
    ? 'All seats priced · price checks on'
    : 'Incomplete pricing · price checks off'
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

  // Drop any unresolved seats left by older Kind-toggle drafts (concept rule:
  // an open search box must never occupy a field seat).
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

  function openComposer(
    intent: NonNullable<Composer>['intent'],
    replace?: BoxFieldRow
  ) {
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
    const keepRole = composer.previous?.role
    const row = catalogSeatFromPick(p, keepRole ?? role, knownUpc)
    const provisionalLocalId = composer.replaceLocalId ?? row.localId
    const withId = { ...row, localId: provisionalLocalId }
    upsertResolved(withId)
    void hydrateBoxFieldRow(createClient(), withId, p, knownUpc).then((hydrated) => {
      if (draftRef.current.fieldProducts.some((r) => r.localId === provisionalLocalId)) {
        patchRow(provisionalLocalId, {
          ...hydrated,
          localId: provisionalLocalId,
          kind: 'product',
          role: withId.role,
        })
      }
    })
  }

  function addPrototype(item: PrototypeListItem, imageUrl: string | null) {
    if (!composer) return
    const role: BoxSeatRole = composer.previous?.role ?? 'yours'
    const row =
      composer.replaceLocalId && composer.previous
        ? applyPrototypeToSeat(composer.previous, item, { imageUrl, role })
        : createPrototypeSeatFromItem(item, { imageUrl, role })
    if (composer.replaceLocalId) {
      upsertResolved({ ...row, localId: composer.replaceLocalId })
    } else {
      upsertResolved(row)
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

  const composerIsCatalog =
    composer?.intent === 'yours_catalog' || composer?.intent === 'competitor_catalog'
  const composerIsPrototype = composer?.intent === 'yours_prototype'
  const isEmpty = rows.length === 0

  function renderComposerPanel() {
    if (!composer) return null
    if (composerIsCatalog) {
      return (
        <div
          style={{
            border: '1px dashed var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: 14,
            background: isEmpty ? 'var(--paper)' : 'var(--surface-1)',
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
                ? 'Replace with a catalog product'
                : composer.intent === 'competitor_catalog'
                  ? 'Add a competitor product'
                  : 'Add your catalog product'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!composer.replaceLocalId ? (
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
              composer.intent === 'competitor_catalog'
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
            background: isEmpty ? 'var(--paper)' : 'var(--surface-1)',
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
                  Use a catalog product instead
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

      {priceReadinessLabel(draft) ? (
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
          {priceReadinessLabel(draft)}
        </p>
      ) : null}

      {isEmpty && !composer ? (
        <div
          style={{
            border: 'var(--cb-border-dashed)',
            borderRadius: 'var(--r-lg)',
            background: 'var(--cb-surface-muted)',
            padding: '28px 24px',
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
            What goes in the box?
          </div>
          <p
            style={{
              margin: '0 auto 18px',
              maxWidth: 360,
              fontSize: 13,
              color: 'var(--ink-50)',
              lineHeight: 1.45,
            }}
          >
            Start with your product or a ready prototype, then add the catalog
            competitors shoppers would compare it against.
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
              onClick={() => openComposer('yours_catalog')}
            >
              + Your catalog product
            </button>
            <button
              type="button"
              className="cb-btn cb-btn-secondary"
              onClick={() => openComposer('yours_prototype')}
            >
              + Your prototype
            </button>
            <button
              type="button"
              className="cb-btn cb-btn-secondary"
              onClick={() => openComposer('competitor_catalog')}
            >
              + Competitor product
            </button>
          </div>
        </div>
      ) : null}

      {isEmpty && composer ? <div style={{ marginTop: 4 }}>{renderComposerPanel()}</div> : null}

      {!isEmpty ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((r) => {
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
                    background: isYours ? 'var(--surface-1)' : 'var(--paper)',
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
                          color: isYours ? 'var(--sage)' : 'var(--ink-50)',
                          background: isYours ? 'var(--sage-soft)' : 'var(--surface-1)',
                          borderRadius: 'var(--cb-radius-pill)',
                          padding: '3px 8px',
                        }}
                      >
                        {isYours ? 'Yours' : 'Competitor'}
                      </span>
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
                            r.packaging === 'plain_sample'
                              ? 'Plain sample'
                              : 'Final packaging',
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
                      <label style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                        Role{' '}
                        <select
                          value={isYours ? 'yours' : 'competitor'}
                          onChange={(e) => {
                            const role: BoxSeatRole =
                              e.target.value === 'yours' ? 'yours' : 'competitor'
                            patchRow(r.localId, { ...r, role })
                          }}
                        >
                          <option value="yours">Yours</option>
                          <option value="competitor">Competitor</option>
                        </select>
                      </label>
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
                      {!isPrototype ? (
                        <button
                          type="button"
                          className="cb-quiet-action"
                          onClick={() => openComposer('yours_prototype', r)}
                        >
                          Use prototype instead
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="cb-quiet-action"
                          onClick={() =>
                            openComposer(
                              isYours ? 'yours_catalog' : 'competitor_catalog',
                              r
                            )
                          }
                        >
                          Use catalog instead
                        </button>
                      )}
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
                              r.packaging === 'plain_sample'
                                ? 'plain_sample'
                                : 'final_packaging'
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
                        {r.packaging === 'plain_sample' ? (
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-50)' }}>
                            Plain samples run taste-only — shelf price checks are skipped for the whole box.
                          </p>
                        ) : (
                          <ShelfPriceInput
                            value={r.price}
                            onChange={(price) => patchRow(r.localId, { ...r, price })}
                          />
                        )}
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
                            openComposer(
                              isYours ? 'yours_catalog' : 'competitor_catalog',
                              r
                            )
                          }
                        />
                      </div>
                    ) : r.product_id != null ? (
                      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
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
                        <ShelfPriceInput
                          value={r.price}
                          onChange={(price) => patchRow(r.localId, { ...r, price })}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}

            {composer ? renderComposerPanel() : null}
          </div>

          {!composer && canAdd ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                className="cb-btn cb-btn-secondary"
                onClick={() => openComposer('yours_catalog')}
              >
                + Your catalog product
              </button>
              <button
                type="button"
                className="cb-btn cb-btn-secondary"
                onClick={() => openComposer('yours_prototype')}
              >
                + Your prototype
              </button>
              <button
                type="button"
                className="cb-btn cb-btn-secondary"
                onClick={() => openComposer('competitor_catalog')}
              >
                + Competitor product
              </button>
            </div>
          ) : null}

          {!composer && !canAdd ? (
            <p className="cb-field-note" style={{ margin: '16px 0 0' }}>
              Field full · {MAX_BOX_FIELD_SIZE} of {MAX_BOX_FIELD_SIZE}
            </p>
          ) : null}

          <p className="cb-field-note" style={{ marginTop: 12 }}>
            {rows.length} of {MAX_BOX_FIELD_SIZE} seat{rows.length === 1 ? '' : 's'} in the
            box
            {rows.length < 2 ? ' · at least 2 needed' : ''}
            {overBy > 0
              ? ` · remove ${overBy} to fit`
              : !canAdd && rows.length >= 2
                ? ' · full round-robin (10 battles)'
                : ''}
            {missingUpcCount > 0 ? ' · UPC required per catalog product' : ''}
            {unconfirmedCount > 0 ? ' · confirm each catalog product' : ''}
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
