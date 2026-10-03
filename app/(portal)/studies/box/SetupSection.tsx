'use client'

import { useEffect, useRef, useState } from 'react'
import type { BoxStudyDraft } from '@/lib/box/types'
import type { AdminProductSearchResult } from '@/lib/queries'
import { BOX_ANCHORS, boxFieldRowErrors, type BoxPublishFailure } from '@/lib/box/validity'
import { summarizeBoxSetup } from '@/lib/box/builderSummaries'
import { createEmptyBoxFieldRow } from '@/lib/box/defaults'
import { hydrateBoxFieldRow } from '@/lib/box/hydrate'
import { createClient } from '@/lib/supabase'
import {
  getTaxonomyNodeAction,
  type TaxonomyNodeInfo,
} from '../concept/actions'
import CategoryCombobox from '../concept/CategoryCombobox'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import BoxProductSearchSlot from './BoxProductSearchSlot'
import BoxUpcField from './BoxUpcField'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  /** When true, the section collapses (parent owns validity.setupOk). */
  sectionDone?: boolean
}

/** Focal snapshot lives on the first field row; also mirrored to focalProductId.
 *  Picking the focal auto-sets the study category from the product's node. */
export default function SetupSection({
  draft,
  onChange,
  error,
  publishFailure = null,
  sectionDone = false,
}: Props) {
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [focalMeta, setFocalMeta] = useState<{
    name: string
    brand: string
    l1: string | null
    l2: string | null
    l3: string | null
  } | null>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft

  // Resolve the category node label for the breadcrumb / combobox mirror.
  useEffect(() => {
    if (draft.taxonomyNodeId == null) {
      setNode(null)
      return
    }
    let cancelled = false
    void getTaxonomyNodeAction(draft.taxonomyNodeId).then((n) => {
      if (!cancelled) setNode(n)
    })
    return () => {
      cancelled = true
    }
  }, [draft.taxonomyNodeId])

  function pickFocal(p: AdminProductSearchResult, knownUpc?: string) {
    const nodeId = p.taxonomy_node_id ?? null
    const current = draftRef.current
    const focalRow = {
      ...createEmptyBoxFieldRow(),
      product_id: p.product_id,
      frozen_display_name: p.product_name_clean,
      frozen_brand_name: p.brand_name,
      frozen_image_url: p.image_url ?? null,
      taxonomy_node_id: nodeId,
      l2_node_id: p.l2_node_id ?? null,
      upc: knownUpc?.trim() || null,
      frozen_category: p.l3_name ?? p.l2_name ?? p.l1_name ?? null,
      identityConfirmed: !!knownUpc?.trim(),
    }
    const rest = current.fieldProducts.filter((r) => r.product_id !== p.product_id)
    onChange({
      ...current,
      focalProductId: p.product_id,
      taxonomyNodeId: nodeId ?? current.taxonomyNodeId,
      fieldProducts: [focalRow, ...rest],
    })
    setFocalMeta({
      name: p.product_name_clean,
      brand: p.brand_name,
      l1: p.l1_name,
      l2: p.l2_name,
      l3: p.l3_name,
    })
    setOverrideOpen(nodeId == null)
    void hydrateBoxFieldRow(createClient(), focalRow, p, knownUpc).then((hydrated) => {
      const latest = draftRef.current
      if (latest.focalProductId !== p.product_id) return
      onChange({
        ...latest,
        fieldProducts: latest.fieldProducts.map((r) =>
          r.localId === focalRow.localId
            ? {
                ...hydrated,
                identityConfirmed: !!hydrated.upc?.trim(),
              }
            : r
        ),
      })
    })
  }

  function clearFocal() {
    const current = draftRef.current
    onChange({
      ...current,
      focalProductId: null,
      fieldProducts: current.fieldProducts.filter(
        (r) => r.product_id !== current.focalProductId
      ),
    })
    setFocalMeta(null)
    setOverrideOpen(false)
  }

  const focalRow = draft.fieldProducts.find(
    (r) => r.product_id === draft.focalProductId
  )
  const focalName = focalMeta?.name ?? focalRow?.frozen_display_name ?? null
  const focalBrand = focalMeta?.brand ?? focalRow?.frozen_brand_name ?? null
  const breadcrumb =
    node?.breadcrumb ||
    [focalMeta?.l1, focalMeta?.l2, focalMeta?.l3].filter(Boolean).join(' › ')
  const rowErrors = boxFieldRowErrors(draft, publishFailure)
  const focalUpcError = focalRow ? rowErrors[focalRow.localId] : undefined

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.setup}
      title="Setup"
      summary={summarizeBoxSetup(draft)}
      done={sectionDone}
    >
      <p style={helpStyle}>
        Name the study, then choose the hero product this box is about. Its category
        fills in automatically.
      </p>

      {/* name */}
      <div style={{ marginBottom: 24, maxWidth: 480 }}>
        <label htmlFor={BOX_ANCHORS.name} style={labelSm}>
          Study name
        </label>
        <input
          id={BOX_ANCHORS.name}
          className="cb-input"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="e.g. Gluten-free NYC discovery box"
          style={inputBase}
        />
      </div>

      {/* focal product */}
      <div id={BOX_ANCHORS.category} style={{ marginBottom: 8 }}>
        <div style={labelSm}>Hero product</div>
        {focalName && focalRow ? (
          <div className="cb-box-hero">
            <div className="cb-box-hero-top">
              <div className="cb-box-hero-photo" aria-hidden={!focalRow.frozen_image_url}>
                {focalRow.frozen_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={focalRow.frozen_image_url} alt="" />
                ) : (
                  <span className="cb-box-hero-photo-fallback">
                    {(focalName.trim().charAt(0) || '?').toUpperCase()}
                  </span>
                )}
              </div>
              <div className="cb-box-hero-identity">
                <div className="cb-box-hero-identity-head">
                  <div className="cb-box-hero-names">
                    <div className="cb-box-hero-name">{focalName}</div>
                    {focalBrand ? (
                      <div className="cb-box-hero-brand">{focalBrand}</div>
                    ) : null}
                  </div>
                  <button type="button" className="cb-quiet-action" onClick={clearFocal}>
                    Change
                  </button>
                </div>
                {breadcrumb ? (
                  <div className="cb-box-hero-crumb">{breadcrumb}</div>
                ) : null}
              </div>
            </div>
            <div className="cb-box-hero-barcode">
              <BoxUpcField
                row={focalRow}
                density="hero"
                onSelectUpc={(upc) => {
                  const latest = draftRef.current
                  onChange({
                    ...latest,
                    fieldProducts: latest.fieldProducts.map((r) =>
                      r.localId === focalRow.localId
                        ? { ...r, upc, identityConfirmed: true }
                        : r
                    ),
                  })
                }}
                error={focalUpcError}
              />
            </div>
          </div>
        ) : (
          <BoxProductSearchSlot
            taken={new Set()}
            onPick={pickFocal}
            entryModes
            placeholder="Search for the hero product by name, brand, or barcode…"
          />
        )}
      </div>

      {focalName && draft.taxonomyNodeId == null ? (
        <p style={{ ...helpStyle, margin: '12px 0 0', maxWidth: 560 }}>
          This product has no category yet. Choose one below, or pick a different hero.
        </p>
      ) : null}

      {/* deliberate category override — rare; also the path when the hero has no node */}
      {focalName ? (
        <div style={{ marginTop: 16 }}>
          {overrideOpen ? (
            <div>
              <p style={{ ...helpStyle, margin: '0 0 8px', maxWidth: 560 }}>
                {draft.taxonomyNodeId == null
                  ? 'Pick the decision this box belongs in.'
                  : "The category is normally the hero product's own. Override only if you know the box belongs in a different decision."}
              </p>
              <CategoryCombobox
                selected={null}
                pendingNodeId={null}
                required={draft.taxonomyNodeId == null}
                onSelect={(n) => {
                  setNode(n)
                  setOverrideOpen(false)
                  onChange({ ...draft, taxonomyNodeId: n.taxonomy_node_id })
                }}
                onClear={() => {
                  setOverrideOpen(false)
                }}
                error={error ?? null}
              />
            </div>
          ) : (
            <button
              type="button"
              className="cb-quiet-action"
              onClick={() => setOverrideOpen(true)}
            >
              Change category
            </button>
          )}
        </div>
      ) : null}

      {error && !overrideOpen ? (
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
const labelSm = {
  display: 'block' as const,
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 8,
}
const inputBase = {
  width: '100%',
  boxSizing: 'border-box' as const,
  height: 48,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '0 16px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
}
