'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  fetchRetailerRegions,
  fetchShoppableRetailers,
  type RegionOption,
  type RetailerOption,
} from '@/lib/distribution/api'
import type { DistributionCoord } from '@/lib/distribution/coords'
import type { DistributionRow } from '@/lib/distribution/grouping'
import SearchCombobox from '../SearchCombobox'
import type { PendingDeclare, SkuOption } from '../types'
import ModalFrame from './ModalFrame'

export default function AddPlaceModal({
  multiVariant,
  skus,
  prefill,
  rows,
  busy,
  onClose,
  onSubmit,
}: {
  multiVariant: boolean
  skus: SkuOption[]
  prefill?: Partial<DistributionCoord> & {
    afterCorrect?: boolean
    note?: string
  }
  rows: DistributionRow[]
  busy: boolean
  onClose: () => void
  onSubmit: (pending: PendingDeclare) => void
}) {
  const [retailers, setRetailers] = useState<RetailerOption[]>([])
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retailerId, setRetailerId] = useState<number | null>(
    prefill?.retailer_id ?? null,
  )
  const [scope, setScope] = useState<'national' | 'region'>(
    prefill?.scope_level === 'national' ? 'national' : 'region',
  )
  const [geoRegionId, setGeoRegionId] = useState<number | null>(
    prefill?.geo_region_id ?? null,
  )
  const [variantChoice, setVariantChoice] = useState<string>(
    prefill?.sku_variant_id != null
      ? String(prefill.sku_variant_id)
      : multiVariant
        ? ''
        : 'all',
  )
  const [correctNote, setCorrectNote] = useState('')
  const isCorrect = Boolean(prefill?.afterCorrect)
  const variantId = useId()
  const correctionNoteId = useId()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const supabase = createClient()
      const result = await fetchShoppableRetailers(supabase)
      if (cancelled) return
      if (result.error) setLoadError(result.error)
      else setRetailers(result.retailers)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (retailerId == null) {
      setRegions([])
      return
    }
    let cancelled = false
    void (async () => {
      const supabase = createClient()
      const result = await fetchRetailerRegions(supabase, retailerId)
      if (cancelled) return
      if (result.error) setLoadError(result.error)
      else setRegions(result.regions)
    })()
    return () => {
      cancelled = true
    }
  }, [retailerId])

  const retailerOptions = retailers.map((retailer) => ({
    id: String(retailer.id),
    label: retailer.name,
  }))
  const regionOptions = regions.map((region) => ({
    id: String(region.geo_region_id),
    label:
      region.region_type === 'state'
        ? `${region.region_name}${region.region_code ? ` (${region.region_code})` : ''}`
        : region.region_name,
  }))

  const coveredWarning = useMemo(() => {
    if (retailerId == null || scope !== 'region' || geoRegionId == null) {
      return null
    }
    const skuId =
      variantChoice === 'all' || variantChoice === ''
        ? null
        : Number(variantChoice)
    const national = rows.find(
      (row) =>
        row.retailer_id === retailerId &&
        row.scope_level === 'national' &&
        row.brand_status === 'active' &&
        row.sku_variant_id === skuId,
    )
    if (national) {
      return `This banner already has a nationwide claim${national.variant_label ? ` for ${national.variant_label}` : ''}. A regional claim is still allowed, but shoppers may already see it nationwide.`
    }
    const covered = rows.find(
      (row) =>
        row.retailer_id === retailerId &&
        row.geo_region_id === geoRegionId &&
        row.covered_by_national &&
        row.sku_variant_id === skuId,
    )
    if (covered) {
      return 'This region is already covered by a nationwide claim at this banner.'
    }
    return null
  }, [retailerId, scope, geoRegionId, variantChoice, rows])

  function submit() {
    if (retailerId == null) {
      setLoadError('Pick a retailer.')
      return
    }
    if (scope === 'region' && geoRegionId == null) {
      setLoadError('Pick a state or metro.')
      return
    }
    if (multiVariant && variantChoice === '') {
      setLoadError('Choose which pack sizes this applies to.')
      return
    }
    if (isCorrect && !correctNote.trim()) {
      setLoadError('Add a short note explaining the correction.')
      return
    }
    const skuVariantId =
      !multiVariant || variantChoice === 'all'
        ? null
        : Number(variantChoice)
    onSubmit({
      retailerId,
      scopeLevel: scope,
      geoRegionId: scope === 'region' ? geoRegionId : null,
      skuVariantId,
      afterCorrectCoord: isCorrect
        ? {
            retailer_id: prefill!.retailer_id!,
            scope_level: prefill!.scope_level!,
            geo_region_id: prefill!.geo_region_id ?? null,
            retail_location_id: prefill!.retail_location_id ?? null,
            sku_variant_id: prefill!.sku_variant_id ?? null,
          }
        : undefined,
      afterCorrectNote: isCorrect ? correctNote.trim() : undefined,
    })
  }

  return (
    <ModalFrame
      title={isCorrect ? 'Correct this place' : 'Add a place'}
      description={
        isCorrect
          ? 'Declare the right distribution first. We only mark the shopper reports as corrected after that succeeds.'
          : 'Tell us where this product is authorised to be carried.'
      }
      busy={busy}
      onClose={onClose}
    >
        {loadError ? <div className="wis-error">{loadError}</div> : null}

        <div className="wis-field">
          <label>Retailer</label>
          <SearchCombobox
            label="Retailer"
            options={retailerOptions}
            valueId={retailerId == null ? null : String(retailerId)}
            placeholder="Search banners…"
            disabled={busy}
            onChange={(id) => {
              const nextRetailerId = id == null ? null : Number(id)
              if (nextRetailerId === retailerId) return
              setRetailerId(nextRetailerId)
              setGeoRegionId(null)
              setRegions([])
            }}
          />
        </div>

        <div className="wis-field">
          <label>Scope</label>
          <div className="wis-radios">
            <label>
              <input
                type="radio"
                name="wis-scope"
                checked={scope === 'region'}
                onChange={() => setScope('region')}
                disabled={busy}
              />
              Specific state or metro
            </label>
            <label>
              <input
                type="radio"
                name="wis-scope"
                checked={scope === 'national'}
                onChange={() => setScope('national')}
                disabled={busy}
              />
              Nationwide at this retailer
            </label>
          </div>
        </div>

        {scope === 'region' ? (
          <div className="wis-field">
            <label>Region</label>
            <SearchCombobox
              label="Region"
              options={regionOptions}
              valueId={geoRegionId == null ? null : String(geoRegionId)}
              placeholder={
                retailerId == null
                  ? 'Pick a retailer first'
                  : 'Search states & metros…'
              }
              disabled={busy || retailerId == null}
              onChange={(id) =>
                setGeoRegionId(id == null ? null : Number(id))
              }
            />
          </div>
        ) : null}

        {multiVariant ? (
          <div className="wis-field">
            <label htmlFor={variantId}>Which variants</label>
            <select
              id={variantId}
              value={variantChoice}
              disabled={busy}
              onChange={(event) => setVariantChoice(event.target.value)}
            >
              <option value="">Select…</option>
              <option value="all">All pack sizes</option>
              {skus.map((sku) => (
                <option
                  key={sku.sku_variant_id}
                  value={String(sku.sku_variant_id)}
                >
                  {sku.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {isCorrect ? (
          <div className="wis-field">
            <label htmlFor={correctionNoteId}>
              Why is this a correction?
            </label>
            <textarea
              id={correctionNoteId}
              value={correctNote}
              disabled={busy}
              onChange={(event) => setCorrectNote(event.target.value)}
              placeholder="Required — what should have been reported?"
            />
          </div>
        ) : null}

        {coveredWarning ? <p className="wis-warn">{coveredWarning}</p> : null}

        <div className="wis-modal-actions">
          <button
            type="button"
            className="wis-btn wis-btn--quiet"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            onClick={submit}
            disabled={busy}
          >
            {isCorrect ? 'Save correction' : 'Add'}
          </button>
        </div>
    </ModalFrame>
  )
}
