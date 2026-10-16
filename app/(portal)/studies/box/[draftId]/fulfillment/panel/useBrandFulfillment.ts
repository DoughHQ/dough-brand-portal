import { useEffect, useState, useTransition } from 'react'
import {
  type AddressChanges,
  type BrandFulfillmentAction,
  type BrandFulfillmentRow,
  type ShipHolds,
} from '@/lib/box/brandFulfillment'
import {
  advanceBrandFulfillmentAction,
  listBrandBoxFulfillmentsAction,
} from '../actions'

export type BrandFulfillmentState = ReturnType<typeof useBrandFulfillment>

export function useBrandFulfillment(boxId: string) {
  const [rows, setRows] = useState<BrandFulfillmentRow[] | null>(null)
  const [holds, setHolds] = useState<ShipHolds>({})
  const [addressChanges, setAddressChanges] = useState<AddressChanges>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [shipFor, setShipFor] = useState<string | null>(null)
  const [tracking, setTracking] = useState('')
  const [carrier, setCarrier] = useState('')
  const [confirm, setConfirm] = useState<{
    fulfillmentId: string
    target: 'delivered' | 'delivery_failed'
  } | null>(null)
  const [failReason, setFailReason] = useState('')

  useEffect(() => {
    startTransition(async () => {
      const res = await listBrandBoxFulfillmentsAction(boxId)
      if (res.ok) {
        setRows(res.rows)
        setHolds(res.holds)
        setAddressChanges(res.addressChanges)
        setLoadError(null)
      } else {
        setLoadError(res.error)
      }
    })
  }, [boxId])

  function run(
    fulfillmentId: string,
    target: BrandFulfillmentAction,
    extra?: { trackingRef?: string; carrier?: string; reason?: string }
  ) {
    startTransition(async () => {
      const res = await advanceBrandFulfillmentAction({
        boxId,
        fulfillmentId,
        target,
        trackingRef: extra?.trackingRef,
        carrier: extra?.carrier,
        reason: extra?.reason,
      })
      setConfirm(null)
      setFailReason('')
      if (res.ok) {
        setRows(res.rows)
        setHolds(res.holds)
        setAddressChanges(res.addressChanges)
        setActionError(null)
        setShipFor(null)
        setTracking('')
        setCarrier('')
        setToast(res.message)
      } else {
        setActionError(res.error)
        if (res.rows && res.holds) {
          setRows(res.rows)
          setHolds(res.holds)
          if (res.addressChanges) setAddressChanges(res.addressChanges)
          setShipFor(null)
        }
      }
    })
  }

  const copy = confirm
    ? confirm.target === 'delivered'
      ? {
          title: 'Mark this box delivered?',
          body: 'Delivery starts the respondent window. You can no longer move this seat after this.',
          confirmLabel: 'Mark delivered',
          tone: 'caution' as const,
        }
      : {
          title: 'Mark delivery failed?',
          body: 'This takes the seat out of the shipping pipeline. You can retry later.',
          confirmLabel: 'Mark failed',
          tone: 'destructive' as const,
        }
    : null

  return {
    rows,
    holds,
    addressChanges,
    loadError,
    actionError,
    toast,
    pending,
    shipFor,
    setShipFor,
    tracking,
    setTracking,
    carrier,
    setCarrier,
    confirm,
    setConfirm,
    failReason,
    setFailReason,
    run,
    copy,
  }
}
