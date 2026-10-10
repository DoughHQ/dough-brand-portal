'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PortalUser } from '@/lib/queries'
import type { ProductMaster } from '@/lib/productMaster/types'
import { pageShell, caption } from '@/lib/productMaster/styles'
import { coveragePct } from '@/lib/productMaster/format'
import { usePcfBrandAskCount } from '@/components/transparency/usePcfBrandAskCount'
import { proofTabAskBadge } from '@/lib/transparency/proofAskCounts'
import type { ProductStudyCard } from '@/lib/productMaster/productHeroStudies'
import './tabs/productDetailTabs.css'
import {
  parseProductDetailTab,
  parseSelectedSkuId,
  type ProductDetailTab,
} from './tabs/productDetailTabs'
import {
  ProductActivityTab,
  ProductFacetsTab,
  ProductProofTab,
  ProductStudiesTab,
} from './tabs/ProductDetailTabPanels'
import { useProductMasterWrites } from './tabs/useProductMasterWrites'
import { StaleWritePanel } from './tabs/StaleWritePanel'
import { ProductMasterHero } from './tabs/ProductMasterHero'
import { OverviewTab } from './tabs/OverviewTab'
import { PackagesTab } from './tabs/PackagesTab'
import { PricingTab } from './tabs/PricingTab'
import { NutritionTab } from './tabs/NutritionTab'
import { ImagesTab } from './tabs/ImagesTab'
import { IntelligenceTab } from './tabs/IntelligenceTab'

type Props = {
  portalUser: PortalUser
  effectiveBrandId: number
  initial: ProductMaster
  studies: ProductStudyCard[]
  isImpersonating?: boolean
}

export default function ProductMasterClient({
  portalUser,
  effectiveBrandId,
  initial,
  studies,
  isImpersonating: _isImpersonating,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const imageFileRef = useRef<HTMLInputElement>(null)

  const canEdit =
    portalUser.role === 'brand_admin' || portalUser.role === 'dough_admin'
  const isAdmin = portalUser.role === 'dough_admin'

  const writes = useProductMasterWrites({
    initial,
    effectiveBrandId,
    canEdit,
    isAdmin,
  })
  const {
    master,
    product,
    flash,
    errorMsg,
    stale,
    setStale,
    setEditingField,
    uploading,
    pendingFields,
    refetch,
    uploadImage,
  } = writes

  const [tab, setTab] = useState<ProductDetailTab>(() =>
    parseProductDetailTab(searchParams.get('tab'))
  )
  const [skuId, setSkuId] = useState<number | null>(() =>
    parseSelectedSkuId(
      searchParams.get('sku'),
      initial.skus.map((s) => s.sku_variant_id)
    )
  )

  const pcfAsk = usePcfBrandAskCount(product.product_id)
  const proofAskCount = proofTabAskBadge(pcfAsk ?? null)
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
      const path = `/products/${product.product_id}`
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false })
    },
    [router, searchParams, tab, skuId, skuIds, product.product_id]
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

  const selectedSku =
    master.skus.find((s) => s.sku_variant_id === skuId) ?? master.skus[0] ?? null
  const cov = master.coverage

  return (
    <div className="pm-page" style={pageShell}>
      <ProductMasterHero
        master={master}
        writes={writes}
        canEdit={canEdit}
        isAdmin={isAdmin}
        selectedSkuId={skuId}
        tab={tab}
        studies={studies}
        proofAskCount={proofAskCount}
        flash={flash}
        errorMsg={errorMsg}
        stalePanel={
          stale ? (
            <StaleWritePanel
              stale={stale}
              onKeep={async () => {
                setStale(null)
                setEditingField(null)
                await refetch()
              }}
              onReapply={async () => {
                const fresh = await refetch()
                if (!fresh) return
                setStale(null)
                await stale.retry(fresh.product.row_version)
              }}
              onDismiss={() => setStale(null)}
            />
          ) : null
        }
        onSelectSku={selectSku}
        onSelectTab={selectTab}
      />

      {tab === 'overview' && (
        <OverviewTab master={master} writes={writes} canEdit={canEdit} isAdmin={isAdmin} />
      )}
      {tab === 'packages' && (
        <PackagesTab
          master={master}
          writes={writes}
          canEdit={canEdit}
          selectedSkuId={skuId}
          onSelectSku={selectSku}
        />
      )}
      {tab === 'pricing' && (
        <PricingTab master={master} writes={writes} selectedSku={selectedSku} />
      )}
      {tab === 'nutrition' && (
        <NutritionTab
          master={master}
          selectedSku={selectedSku}
          pendingFields={pendingFields}
        />
      )}
      {tab === 'intelligence' && <IntelligenceTab master={master} />}
      {tab === 'studies' && <ProductStudiesTab studies={studies} />}
      {tab === 'facets' && (
        <ProductFacetsTab productId={product.product_id} canEdit={canEdit} />
      )}
      {tab === 'proof' && (
        <ProductProofTab
          productId={product.product_id}
          brandId={effectiveBrandId}
          canEdit={canEdit}
          ingredientStatement={
            selectedSku?.ingredients?.ingredients_text_raw ?? null
          }
          pcfAsk={pcfAsk ?? null}
        />
      )}
      {tab === 'images' && (
        <ImagesTab master={master} writes={writes} canEdit={canEdit} />
      )}
      {tab === 'activity' && <ProductActivityTab />}

      {cov && (
        <p style={{ ...caption, margin: '28px 0 0' }}>
          Across {cov.active_products.toLocaleString()} active products:{' '}
          {coveragePct(cov.with_nutrition, cov.active_products)} have nutrition ·{' '}
          {coveragePct(cov.with_micronutrients, cov.active_products)} have micronutrients ·{' '}
          {coveragePct(cov.with_image, cov.active_products)} have an image ·{' '}
          {coveragePct(cov.with_price, cov.active_products)} have a price.
          <span style={{ color: 'var(--ink-30)' }}> · as of {cov.as_of}</span>
        </p>
      )}

      {canEdit ? (
        <input
          id="pm-product-image-file"
          ref={imageFileRef}
          className="pm-hero-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              void uploadImage(f, { makePrimary: !product.primary_image_url })
            }
            e.target.value = ''
          }}
        />
      ) : null}
    </div>
  )
}
