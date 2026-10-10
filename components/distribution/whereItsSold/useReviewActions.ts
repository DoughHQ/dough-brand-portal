'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import {
  delistDeclaration,
  reviewCoordinate,
  withdrawDeclaration,
} from '@/lib/distribution/api'
import { formatCalendarDate } from '@/lib/distribution/actions'
import {
  coordFromRow,
  serializeCoord,
  type DistributionCoord,
} from '@/lib/distribution/coords'
import {
  packConflict,
  type AvailabilityReport,
  type DistributionRow,
} from '@/lib/distribution/grouping'
import type { DistributionActionRuntime } from './types'

export default function useReviewActions({
  productId,
  setError,
  setBusy,
  isCurrentProduct,
  afterWrite,
}: DistributionActionRuntime) {
  const onConfirmCoord = useCallback(
    async (row: DistributionRow, pending: AvailabilityReport[]) => {
      if (packConflict(pending)) return
      const expectedProductId = productId
      setBusy(`confirm-${serializeCoord(coordFromRow(row))}`)
      setError(null)
      const result = await reviewCoordinate(createClient(), {
        productId,
        retailerId: row.retailer_id,
        scopeLevel: row.scope_level,
        action: 'confirm',
        geoRegionId: row.geo_region_id,
        retailLocationId: row.retail_location_id,
        skuVariantId: row.sku_variant_id,
      })
      if (!isCurrentProduct(expectedProductId)) return
      setBusy(null)
      if (result.error) {
        setError(result.error)
        return
      }
      const count = result.result?.reportsAffected ?? pending.length
      await afterWrite(
        count === 1
          ? `Confirmed — added ${row.retailer_name} · ${row.scope_label} to your distribution.`
          : `Confirmed ${count} shopper reports — added ${row.retailer_name} · ${row.scope_label}.`,
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

  const onWithdraw = useCallback(
    async (row: DistributionRow) => {
      if (row.declaration_id == null) return
      const expectedProductId = productId
      setBusy(`withdraw-${row.declaration_id}`)
      setError(null)
      const result = await withdrawDeclaration(
        createClient(),
        row.declaration_id,
      )
      if (!isCurrentProduct(expectedProductId)) return
      setBusy(null)
      if (result.error) {
        setError(result.error)
        return
      }
      await afterWrite(
        `You withdrew ${row.retailer_name} · ${row.scope_label}.`,
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

  const onDelist = useCallback(
    async (declarationId: number, date: string) => {
      const expectedProductId = productId
      setBusy(`delist-${declarationId}`)
      setError(null)
      const result = await delistDeclaration(
        createClient(),
        declarationId,
        date,
      )
      if (!isCurrentProduct(expectedProductId)) return
      setBusy(null)
      if (result.error) {
        setError(result.error)
        return
      }
      await afterWrite(
        `Marked delisted as of ${formatCalendarDate(date)}.`,
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

  const onDispute = useCallback(
    async (coord: DistributionCoord, note: string) => {
      const expectedProductId = productId
      setBusy(`dispute-${serializeCoord(coord)}`)
      setError(null)
      const result = await reviewCoordinate(createClient(), {
        productId,
        retailerId: coord.retailer_id,
        scopeLevel: coord.scope_level,
        action: 'dispute',
        geoRegionId: coord.geo_region_id,
        retailLocationId: coord.retail_location_id,
        skuVariantId: coord.sku_variant_id,
        note,
      })
      if (!isCurrentProduct(expectedProductId)) return
      setBusy(null)
      if (result.error) {
        setError(result.error)
        return
      }
      const count = result.result?.reportsAffected ?? 0
      await afterWrite(
        count > 1
          ? `Disputed ${count} reports — escalated to Dough. Sightings stay visible.`
          : 'Disputed — escalated to Dough. The shopper report stays visible.',
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

  return { onConfirmCoord, onWithdraw, onDelist, onDispute }
}
