import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser, getBrand, getSubscription, getBrandProducts } from '@/lib/queries'
import ProductsClient from './ProductsClient'

export default async function ProductsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser) redirect('/login')

  const [brand, subscription] = await Promise.all([
    getBrand(portalUser.brand_id),
    getSubscription(portalUser.brand_id),
  ])
  if (!brand) redirect('/login')

  const claimedIds = subscription?.claimed_product_ids ?? []
  const products = await getBrandProducts(portalUser.brand_id, claimedIds)

  return (
    <ProductsClient
      portalUser={portalUser}
      brand={brand}
      subscription={subscription}
      products={products}
      claimedIds={claimedIds}
    />
  )
}
