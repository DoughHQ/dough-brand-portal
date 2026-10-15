'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ProductMaster } from '@/lib/productMaster/types'
import {
  parseProductDetailTab,
  parseSelectedSkuId,
  type ProductDetailTab,
} from '../tabs/productDetailTabs'

export function useProductMasterNav({
  initial,
  master,
  productId,
}: {
  initial: ProductMaster
  master: ProductMaster
  productId: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState<ProductDetailTab>(() =>
    parseProductDetailTab(searchParams.get('tab'))
  )
  const [skuId, setSkuId] = useState<number | null>(() =>
    parseSelectedSkuId(
      searchParams.get('sku'),
      initial.skus.map((s) => s.sku_variant_id)
    )
  )

  const skuIds = useMemo(() => master.skus.map((s) => s.sku_variant_id), [master.skus])

  useEffect(() => {
    setTab(parseProductDetailTab(searchParams.get('tab')))
    setSkuId(parseSelectedSkuId(searchParams.get('sku'), skuIds))
  }, [searchParams, skuIds])

  const writeProductParams = useCallback(
    (patch: { tab?: ProductDetailTab; skuId?: number | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      const nextTab = patch.tab ?? tab
      if (nextTab === 'overview') params.delete('tab')
      else params.set('tab', nextTab)

      const nextSku = patch.skuId !== undefined ? patch.skuId : skuId
      if (nextSku != null && skuIds.length > 1 && skuIds.includes(nextSku)) {
        params.set('sku', String(nextSku))
      } else {
        params.delete('sku')
      }

      const qs = params.toString()
      const path = `/products/${productId}`
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false })
    },
    [router, searchParams, tab, skuId, skuIds, productId]
  )

  const selectTab = useCallback(
    (next: ProductDetailTab) => {
      setTab(next)
      writeProductParams({ tab: next })
    },
    [writeProductParams]
  )

  const selectSku = useCallback(
    (next: number) => {
      setSkuId(next)
      writeProductParams({ skuId: next })
    },
    [writeProductParams]
  )

  return { tab, skuId, selectTab, selectSku }
}
