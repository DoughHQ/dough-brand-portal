'use client'

import { useMemo, useRef, useState } from 'react'
import type { BoxFieldRow, BoxStudyDraft } from '@/lib/box/types'
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
  clearCatalogFromSeat,
  clearPrototypeFromSeat,
  createPrototypeSeatFromItem,
} from '@/lib/box/applyPrototypeSeat'
import { hydrateBoxFieldRow } from '@/lib/box/hydrate'
import { BOX_UPC_SCAN_HELP } from '@/lib/box/constants'
import { canAddBoxProduct, MAX_BOX_FIELD_SIZE } from '@/lib/box/fieldSize'
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
  /** L2 node id of the focal, to encourage same-area picks. */
  focalL2NodeId?: number | null
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  sectionDone?: boolean
}

type AddingMode = false | 'catalog' | 'prototype'

export default function ContentsSection({
  draft,
  onChange,
  focalL2NodeId = null,
  error,
  publishFailure = null,
  sectionDone = false,
}: Props) {
  const [adding, setAdding] = useState<AddingMode>(false)
  /** Seat localIds that are mid-pick after Kind → Prototype. */
  const [pickingSeatIds, setPickingSeatIds] = useState<Set<string>>(() => new Set())
  const draftRef = useRef(draft)
  draftRef.current = draft

  const rows = draft.fieldProducts
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
    () =>
      new Set(
        rows
          .map((r) => r.prototype_id)
          .filter((id): id is string => !!id)
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

  function setSeatPicking(localId: string, on: boolean) {
    setPickingSeatIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(localId)
      else next.delete(localId)
      return next
    })
  }

  function addProduct(p: AdminProductSearchResult, knownUpc?: string) {
    if (!canAddBoxProduct(draftRef.current)) {
      setAdding(false)
      return
    }
    const row: BoxFieldRow = {
      ...createEmptyBoxFieldRow(),
      kind: 'product',
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

  function addPrototype(item: PrototypeListItem, imageUrl: string | null) {
    if (!canAddBoxProduct(draftRef.current)) {
      setAdding(false)
      return
    }
    if (takenPrototypes.has(item.id)) return
    const row = createPrototypeSeatFromItem(item, { imageUrl })
    const current = draftRef.current
    onChange({ ...current, fieldProducts: [...current.fieldProducts, row] })
    setAdding(false)
  }

  function bindPrototypeToSeat(
    localId: string,
    item: PrototypeListItem,
    imageUrl: string | null
  ) {
    const current = draftRef.current
    const existing = current.fieldProducts.find((r) => r.localId === localId)
    if (!existing) return
    if (takenPrototypes.has(item.id) && existing.prototype_id !== item.id) return
    patchRow(localId, applyPrototypeToSeat(existing, item, { imageUrl }))
    setSeatPicking(localId, false)
  }

  function removeRow(localId: string, productId: number | null) {
    if (productId != null && productId === draft.focalProductId) {
      onChange({
        ...draftRef.current,
        focalProductId: null,
        fieldProducts: draftRef.current.fieldProducts.filter(
          (r) => r.localId !== localId
        ),
      })
      return
    }
    onChange({
      ...draftRef.current,
      fieldProducts: draftRef.current.fieldProducts.filter((r) => r.localId !== localId),
    })
    setSeatPicking(localId, false)
  }

  function setKind(localId: string, kind: 'product' | 'prototype') {
    const current = draftRef.current
    const existing = current.fieldProducts.find((r) => r.localId === localId)
    if (!existing || existing.kind === kind) return
    if (kind === 'prototype') {
      patchRow(localId, clearCatalogFromSeat(existing))
      setSeatPicking(localId, true)
      setAdding(false)
      return
    }
    patchRow(localId, clearPrototypeFromSeat(existing))
    setSeatPicking(localId, false)
  }

  const resolvedCount = rows.filter(
    (r) =>
      (r.kind === 'prototype' && !!r.prototype_id) ||
      (r.kind !== 'prototype' && r.product_id != null)
  ).length
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
        Two to five seats. Mark at least one as Yours. Catalog products keep barcodes and
        allergen confirms; prototypes use library packaging and server-issued labels.
      </p>

      <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((r) => {
              const isYours = r.role === 'yours'
              const isPrototype = r.kind === 'prototype'
              const needsPrototypePick =
                isPrototype && (!r.prototype_id || pickingSeatIds.has(r.localId))
              const differentCategory =
                r.taxonomy_node_id != null &&
                draft.taxonomyNodeId != null &&
                r.taxonomy_node_id !== draft.taxonomyNodeId
              const rowError = rowErrors[r.localId]
              const awaitingConfirm =
                !isPrototype &&
                !!r.upc?.trim() &&
                !isIdentityConfirmed(r)
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
                        marginBottom: 8,
                      }}
                    >
                      <label style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                        Kind{' '}
                        <select
                          value={isPrototype ? 'prototype' : 'product'}
                          onChange={(e) =>
                            setKind(
                              r.localId,
                              e.target.value === 'prototype' ? 'prototype' : 'product'
                            )
                          }
                        >
                          <option value="product">Catalog</option>
                          <option value="prototype">Prototype</option>
                        </select>
                      </label>
                      <label style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                        Role{' '}
                        <select
                          value={r.role === 'yours' ? 'yours' : 'competitor'}
                          onChange={(e) => {
                            const role =
                              e.target.value === 'yours' ? 'yours' : 'competitor'
                            patchRow(r.localId, { ...r, role })
                          }}
                        >
                          <option value="yours">Yours</option>
                          <option value="competitor">Competitor</option>
                        </select>
                      </label>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--ink-80)', fontSize: 15 }}>
                      {r.frozen_display_name ||
                        (isPrototype ? 'Choose a prototype' : 'Unnamed product')}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 2 }}>
                      {isPrototype
                        ? r.prototype_id
                          ? r.packaging === 'plain_sample'
                            ? 'Plain sample'
                            : 'Final packaging'
                          : 'From your private library'
                        : r.frozen_brand_name}
                    </div>

                    {needsPrototypePick ? (
                      <div style={{ marginTop: 12 }}>
                        <BoxPrototypePickSlot
                          taken={takenPrototypes}
                          onPick={(item, imageUrl) =>
                            bindPrototypeToSeat(r.localId, item, imageUrl)
                          }
                          onCancel={
                            r.prototype_id
                              ? () => setSeatPicking(r.localId, false)
                              : rows.length > 1
                                ? () => removeRow(r.localId, r.product_id)
                                : undefined
                          }
                        />
                      </div>
                    ) : isPrototype && r.prototype_id ? (
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
                        <button
                          type="button"
                          className="cb-quiet-action"
                          onClick={() => setSeatPicking(r.localId, true)}
                        >
                          Change prototype
                        </button>
                      </div>
                    ) : awaitingConfirm && r.upc ? (
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
                        onChange={() => {
                          removeRow(r.localId, r.product_id)
                          setAdding('catalog')
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
                  {isYours ? (
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
                      Yours
                    </span>
                  ) : awaitingConfirm ? null : (
                    <button
                      type="button"
                      className="cb-quiet-action"
                      onClick={() => removeRow(r.localId, r.product_id)}
                      aria-label={`Remove ${r.frozen_display_name || 'seat'}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            {adding === 'catalog' && canAdd ? (
              <BoxProductSearchSlot
                taken={takenProducts}
                onPick={addProduct}
                onCancel={() => setAdding(false)}
                preferL2NodeId={focalL2NodeId}
                entryModes
                placeholder="Add another product by name, brand, or barcode…"
              />
            ) : adding === 'prototype' && canAdd ? (
              <BoxPrototypePickSlot
                taken={takenPrototypes}
                onPick={addPrototype}
                onCancel={() => setAdding(false)}
              />
            ) : canAdd ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  className="cb-btn cb-btn-secondary"
                  onClick={() => setAdding('catalog')}
                >
                  + Add catalog product
                </button>
                <button
                  type="button"
                  className="cb-btn cb-btn-secondary"
                  onClick={() => setAdding('prototype')}
                >
                  + Add prototype
                </button>
              </div>
            ) : (
              <p className="cb-field-note" style={{ margin: 0 }}>
                Field full · {MAX_BOX_FIELD_SIZE} of {MAX_BOX_FIELD_SIZE}
              </p>
            )}
          </div>

          <p className="cb-field-note" style={{ marginTop: 12 }}>
            {resolvedCount} of {MAX_BOX_FIELD_SIZE} seat{resolvedCount === 1 ? '' : 's'} in the box
            {resolvedCount < 2 ? ' · at least 2 needed' : ''}
            {overBy > 0
              ? ` · remove ${overBy} to fit`
              : !canAdd && resolvedCount >= 2
                ? ' · full round-robin (10 battles)'
                : ''}
            {missingUpcCount > 0 ? ' · UPC required per catalog product' : ''}
            {unconfirmedCount > 0 ? ' · confirm each catalog product' : ''}
          </p>
        </>

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
