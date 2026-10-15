'use client'
import type { BrandSnapshot, ProductIntelligence, CompetitiveSnapshot, PortalUser, Brand, BrandSubscription } from '@/lib/queries'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'
import type { CatalogHealth } from '@/lib/brandHome/catalogHealth'
import type { OnboardingChecklistInput } from '@/lib/brandHome/onboardingChecklist'
import BrandHome from '@/components/brandHome/BrandHome'
import BrandProfileCard from '@/components/brandHome/BrandProfileCard'
import { DashboardMore } from './more/DashboardMore'
import { useDashboardMore } from './more/useDashboardMore'
import '@/components/brandHome/brandHome.css'

type Props = {
  portalUser: PortalUser
  brand: Brand
  subscription: BrandSubscription | null
  snapshot: BrandSnapshot | null
  history: { snapshot_date: string; weighted_elo_score: number }[]
  productIntelligence: ProductIntelligence[]
  competitive: CompetitiveSnapshot | null
  allProducts: { product_id: number; product_name_display: string; total_battles: number }[]
  narrative: { headline: string; sub: string }
  isImpersonating?: boolean
  totalProductCount?: number
  /** Brand-wide battle appearances from category launcher (not a product scan). */
  totalBattles?: number
  homeModel: BrandHomeModel
  categoriesCount?: number
  signalCards?: ProductSignalCardModel[]
  domainVerified?: boolean
  catalogHealth?: CatalogHealth
  /** Prefer over subscription.claimed_product_ids.length — chrome denorm. */
  claimedSkuCount?: number
  onboardingChecklist?: OnboardingChecklistInput | null
  welcome?: boolean
}

export default function DashboardClient({ portalUser, brand, subscription, snapshot, history: _history, productIntelligence, competitive: _competitive, allProducts, narrative: _narrative, totalProductCount, totalBattles = 0, homeModel, categoriesCount, signalCards = [], domainVerified = false, catalogHealth, claimedSkuCount, onboardingChecklist = null, welcome = false }: Props) {
  const more = useDashboardMore({
    brandId: brand.brand_id,
    subscription,
    claimedSkuCount,
    totalProductCount,
    allProductsLength: allProducts.length,
  })

  return (
    <>
        <BrandHome
          model={homeModel}
          brandId={brand.brand_id}
          totalProductCount={totalProductCount ?? allProducts.length}
          totalBattles={totalBattles}
          signalCards={signalCards}
          catalogHealth={catalogHealth}
          domainVerified={domainVerified}
          onboardingChecklist={onboardingChecklist}
          welcome={welcome}
          profileSlot={
            <BrandProfileCard
              brand={brand}
              productCount={totalProductCount ?? allProducts.length}
              totalBattles={totalBattles}
              categoriesCount={categoriesCount}
              canSubmitOwnershipCorrection={portalUser.role !== 'brand_viewer'}
              domainVerified={domainVerified}
            />
          }
        />

        <DashboardMore
          more={more}
          brand={brand}
          snapshot={snapshot}
          productIntelligence={productIntelligence}
          allProducts={allProducts}
          totalProductCount={totalProductCount}
        />
    </>
  )
}
