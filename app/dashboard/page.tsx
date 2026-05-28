import { redirect } from 'next/navigation'
import {
  getPortalUser, getBrand, getSubscription, getBrandSnapshot,
  getBrandSnapshotHistory, getProductIntelligence,
  getCompetitiveSnapshot, getAllBrandProducts, generateNarrative,
} from '@/lib/queries'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const portalUser = await getPortalUser()
  if (!portalUser) redirect('/login')

  const [brand, subscription, snapshot, history, competitive, allProducts] = await Promise.all([
    getBrand(portalUser.brand_id),
    getSubscription(portalUser.brand_id),
    getBrandSnapshot(portalUser.brand_id),
    getBrandSnapshotHistory(portalUser.brand_id, 30),
    getCompetitiveSnapshot(portalUser.brand_id),
    getAllBrandProducts(portalUser.brand_id),
  ])

  if (!brand) redirect('/login')

  const claimedIds = subscription?.claimed_product_ids ?? []
  const productIntelligence = await getProductIntelligence(portalUser.brand_id, claimedIds)

  const narrative = snapshot
    ? generateNarrative(snapshot, brand.brand_name_display)
    : {
        headline: `Welcome to Dough, ${brand.brand_name_display}. Your data is being collected.`,
        sub: 'Check back after your first battles are counted · Updated daily',
      }

  return (
    <DashboardClient
      portalUser={portalUser}
      brand={brand}
      subscription={subscription}
      snapshot={snapshot}
      history={history}
      productIntelligence={productIntelligence}
      competitive={competitive}
      allProducts={allProducts}
      narrative={narrative}
    />
  )
}
