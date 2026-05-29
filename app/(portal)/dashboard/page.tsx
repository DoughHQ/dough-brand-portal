import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  getPortalUser, getBrand, getSubscription, getBrandSnapshot,
  getBrandSnapshotHistory, getProductIntelligence,
  getCompetitiveSnapshot, getAllBrandProducts, generateNarrative,
} from '@/lib/queries'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      redirect('/login')
    }

    const portalUser = await getPortalUser()
    if (!portalUser) {
      console.error('No portal user found for auth uid:', user.id)
      redirect('/login')
    }

    const [brand, subscription, snapshot, history, competitive, allProducts] = await Promise.all([
      getBrand(portalUser.brand_id),
      getSubscription(portalUser.brand_id),
      getBrandSnapshot(portalUser.brand_id),
      getBrandSnapshotHistory(portalUser.brand_id, 30),
      getCompetitiveSnapshot(portalUser.brand_id),
      getAllBrandProducts(portalUser.brand_id),
    ])

    if (!brand) {
      console.error('No brand found for brand_id:', portalUser.brand_id)
      redirect('/login')
    }

    const claimedIds = subscription?.claimed_product_ids ?? []
    const productIntelligence = await getProductIntelligence(portalUser.brand_id, claimedIds)

    const narrative = snapshot
      ? generateNarrative(snapshot, brand.brand_name)
      : {
          headline: `Welcome to Dough, ${brand.brand_name}. Your data is being collected.`,
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
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <div style={{ padding: '40px', fontFamily: 'monospace', color: 'red' }}>
        <h2>Dashboard Error</h2>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }
}
