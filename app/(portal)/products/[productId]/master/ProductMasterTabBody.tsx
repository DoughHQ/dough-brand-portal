import type { MasterSku, ProductMaster } from '@/lib/productMaster/types'
import type { BrandProofAskCount } from '@/lib/transparency/proofAskCounts'
import type { ProductStudyCard } from '@/lib/productMaster/productHeroStudies'
import type { ProductDetailTab } from '../tabs/productDetailTabs'
import {
  ProductActivityTab,
  ProductFacetsTab,
  ProductProofTab,
  ProductStudiesTab,
} from '../tabs/ProductDetailTabPanels'
import type { ProductMasterWrites } from '../tabs/useProductMasterWrites'
import { OverviewTab } from '../tabs/OverviewTab'
import { PackagesTab } from '../tabs/PackagesTab'
import { PricingTab } from '../tabs/PricingTab'
import { NutritionTab } from '../tabs/NutritionTab'
import { ImagesTab } from '../tabs/ImagesTab'
import { IntelligenceTab } from '../tabs/IntelligenceTab'

export function ProductMasterTabBody({
  tab,
  master,
  writes,
  canEdit,
  isAdmin,
  skuId,
  selectSku,
  selectedSku,
  pendingFields,
  studies,
  productId,
  effectiveBrandId,
  pcfAsk,
}: {
  tab: ProductDetailTab
  master: ProductMaster
  writes: ProductMasterWrites
  canEdit: boolean
  isAdmin: boolean
  skuId: number | null
  selectSku: (next: number) => void
  selectedSku: MasterSku | null
  pendingFields: ProductMasterWrites['pendingFields']
  studies: ProductStudyCard[]
  productId: number
  effectiveBrandId: number
  pcfAsk: BrandProofAskCount | null | undefined
}) {
  return (
    <>
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
        <ProductFacetsTab productId={productId} canEdit={canEdit} />
      )}
      {tab === 'proof' && (
        <ProductProofTab
          productId={productId}
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
    </>
  )
}
