'use client'

import type { PortalUser } from '@/lib/queries'
import type { ProductMaster } from '@/lib/productMaster/types'
import { pageShell } from '@/lib/productMaster/styles'
import { usePcfBrandAskCount } from '@/components/transparency/usePcfBrandAskCount'
import { proofTabAskBadge } from '@/lib/transparency/proofAskCounts'
import type { ProductStudyCard } from '@/lib/productMaster/productHeroStudies'
import './tabs/productDetailTabs.css'
import { useProductMasterWrites } from './tabs/useProductMasterWrites'
import { StaleWritePanel } from './tabs/StaleWritePanel'
import { ProductMasterHero } from './tabs/ProductMasterHero'
import { ProductCoverageNote } from './master/ProductCoverageNote'
import { ProductImageFileInput } from './master/ProductImageFileInput'
import { ProductMasterTabBody } from './master/ProductMasterTabBody'
import { useProductMasterNav } from './master/useProductMasterNav'

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

  const { tab, skuId, selectTab, selectSku } = useProductMasterNav({
    initial,
    master,
    productId: product.product_id,
  })

  const pcfAsk = usePcfBrandAskCount(product.product_id)
  const proofAskCount = proofTabAskBadge(pcfAsk ?? null)

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

      <ProductMasterTabBody
        tab={tab}
        master={master}
        writes={writes}
        canEdit={canEdit}
        isAdmin={isAdmin}
        skuId={skuId}
        selectSku={selectSku}
        selectedSku={selectedSku}
        pendingFields={pendingFields}
        studies={studies}
        productId={product.product_id}
        effectiveBrandId={effectiveBrandId}
        pcfAsk={pcfAsk}
      />

      <ProductCoverageNote cov={cov} />

      {canEdit ? (
        <ProductImageFileInput
          uploading={uploading}
          hasPrimaryImage={!!product.primary_image_url}
          uploadImage={uploadImage}
        />
      ) : null}
    </div>
  )
}
