'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { coordFromRow } from '@/lib/distribution/coords'
import type { CardHandlers, ModalKind } from './types'
import useDeclarationActions from './useDeclarationActions'
import useReviewActions from './useReviewActions'

type Options = {
  productId: number
  load: () => Promise<void>
  setError: Dispatch<SetStateAction<string | null>>
}

export default function useDistributionActions({
  productId,
  load,
  setError,
}: Options) {
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalKind>(null)
  const productIdRef = useRef(productId)
  productIdRef.current = productId

  useEffect(() => {
    setBusy(null)
    setToast(null)
    setModal(null)
  }, [productId])

  const isCurrentProduct = useCallback(
    (expectedProductId: number) =>
      productIdRef.current === expectedProductId,
    [],
  )

  const afterWrite = useCallback(
    async (message: string, expectedProductId: number) => {
      if (!isCurrentProduct(expectedProductId)) return
      setToast(message)
      setModal(null)
      await load()
    },
    [isCurrentProduct, load],
  )

  const runtime = {
    productId,
    load,
    setError,
    setBusy,
    setToast,
    setModal,
    isCurrentProduct,
    afterWrite,
  }
  const declarations = useDeclarationActions(runtime)
  const reviews = useReviewActions(runtime)

  const cardHandlers = useMemo<CardHandlers>(
    () => ({
      onConfirm: reviews.onConfirmCoord,
      onCorrect: (row) =>
        setModal({
          kind: 'add',
          prefill: {
            retailer_id: row.retailer_id,
            scope_level: row.scope_level,
            geo_region_id: row.geo_region_id,
            retail_location_id: row.retail_location_id,
            sku_variant_id: row.sku_variant_id,
            afterCorrect: true,
          },
        }),
      onDispute: (row) =>
        setModal({
          kind: 'dispute',
          coord: coordFromRow(row),
          retailerName: row.retailer_name,
          scopeLabel: row.scope_label,
        }),
      onClaim: declarations.onClaim,
      onRedeclare: declarations.onRedeclare,
      onWithdraw: reviews.onWithdraw,
      onDelist: (row) => {
        if (row.declaration_id == null) return
        setModal({
          kind: 'delist',
          declarationId: row.declaration_id,
          coveredByNational: row.covered_by_national,
        })
      },
    }),
    [
      declarations.onClaim,
      declarations.onRedeclare,
      reviews.onConfirmCoord,
      reviews.onWithdraw,
    ],
  )

  return {
    busy,
    toast,
    modal,
    setModal,
    runDeclare: declarations.runDeclare,
    onClaimAll: declarations.onClaimAll,
    onDelist: reviews.onDelist,
    onDispute: reviews.onDispute,
    cardHandlers,
  }
}
