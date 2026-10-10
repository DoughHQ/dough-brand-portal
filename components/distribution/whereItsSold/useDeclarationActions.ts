'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import {
  declareAvailability,
  reviewCoordinate,
} from '@/lib/distribution/api'
import { coordFromRow, serializeCoord } from '@/lib/distribution/coords'
import type { DistributionRow } from '@/lib/distribution/grouping'
import type {
  DistributionActionRuntime,
  PendingDeclare,
} from './types'

export default function useDeclarationActions({
  productId,
  load,
  setError,
  setBusy,
  setToast,
  setModal,
  isCurrentProduct,
  afterWrite,
}: DistributionActionRuntime) {
  const runDeclare = useCallback(
    async (pending: PendingDeclare) => {
      const expectedProductId = productId
      const correctionNote = (pending.afterCorrectNote ?? '').trim()
      if (pending.afterCorrectCoord && !correctionNote) {
        setError('Add a short note explaining the correction.')
        return
      }
      setBusy('declare')
      setError(null)
      const supabase = createClient()
      const result = await declareAvailability(supabase, {
        productId,
        retailerId: pending.retailerId,
        scopeLevel: pending.scopeLevel,
        geoRegionId: pending.geoRegionId,
        skuVariantId: pending.skuVariantId,
        notes: pending.notes ?? null,
      })
      if (!isCurrentProduct(expectedProductId)) return
      if (result.error) {
        setError(result.error)
        setBusy(null)
        return
      }
      if (pending.afterCorrectCoord) {
        const coord = pending.afterCorrectCoord
        const review = await reviewCoordinate(supabase, {
          productId,
          retailerId: coord.retailer_id,
          scopeLevel: coord.scope_level,
          action: 'correct',
          geoRegionId: coord.geo_region_id,
          retailLocationId: coord.retail_location_id,
          skuVariantId: coord.sku_variant_id,
          note: correctionNote,
        })
        if (!isCurrentProduct(expectedProductId)) return
        if (review.error) {
          setError(review.error)
          setBusy(null)
          return
        }
      }
      setBusy(null)
      await afterWrite(
        pending.afterCorrectCoord
          ? 'Correction saved — original sightings stay on file as contested.'
          : 'You updated distribution just now.',
        expectedProductId,
      )
    },
    [
      afterWrite,
      isCurrentProduct,
      productId,
      setBusy,
      setError,
    ],
  )

  const onClaim = useCallback(
    async (row: DistributionRow) => {
      if (row.scope_level === 'national') {
        setModal({
          kind: 'nationwide-confirm',
          returnToAdd: false,
          pending: {
            retailerId: row.retailer_id,
            scopeLevel: 'national',
            geoRegionId: null,
            skuVariantId: row.sku_variant_id,
          },
        })
        return
      }
      setBusy(`claim-${serializeCoord(coordFromRow(row))}`)
      await runDeclare({
        retailerId: row.retailer_id,
        scopeLevel: 'region',
        geoRegionId: row.geo_region_id,
        skuVariantId: row.sku_variant_id,
      })
    },
    [runDeclare, setBusy, setModal],
  )

  const onRedeclare = useCallback(
    async (row: DistributionRow) => {
      setBusy(`redeclare-${serializeCoord(coordFromRow(row))}`)
      await runDeclare({
        retailerId: row.retailer_id,
        scopeLevel:
          row.scope_level === 'national' ? 'national' : 'region',
        geoRegionId: row.geo_region_id,
        skuVariantId: row.sku_variant_id,
      })
    },
    [runDeclare, setBusy],
  )

  const onClaimAll = useCallback(
    async (seeds: DistributionRow[]) => {
      const expectedProductId = productId
      setBusy('claim-all')
      setError(null)
      const supabase = createClient()
      let succeeded = 0
      const failures: string[] = []
      for (const row of seeds) {
        const result = await declareAvailability(supabase, {
          productId,
          retailerId: row.retailer_id,
          scopeLevel:
            row.scope_level === 'national' ? 'national' : 'region',
          geoRegionId: row.geo_region_id,
          skuVariantId: row.sku_variant_id,
        })
        if (!isCurrentProduct(expectedProductId)) return
        if (result.error) failures.push(`${row.retailer_name}: ${result.error}`)
        else succeeded += 1
      }
      setBusy(null)
      setModal(null)
      if (failures.length === 0) {
        await afterWrite(
          `Claimed ${succeeded} place${succeeded === 1 ? '' : 's'} — added to your distribution.`,
          expectedProductId,
        )
        return
      }
      setToast(
        `Claimed ${succeeded} of ${seeds.length}. ${failures.length} failed.`,
      )
      const failureMessage = failures.slice(0, 3).join(' · ')
      await load()
      if (!isCurrentProduct(expectedProductId)) return
      setError((currentError) => currentError ?? failureMessage)
    },
    [
      afterWrite,
      isCurrentProduct,
      load,
      productId,
      setBusy,
      setError,
      setModal,
      setToast,
    ],
  )

  return { runDeclare, onClaim, onRedeclare, onClaimAll }
}
