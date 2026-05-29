import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser, getBrand, getSubscription, getProductDetail, getProductBattleHistory } from '@/lib/queries'
import ProductDetailClient from './ProductDetailClient'

interface Props {
  params: Promise<{ productId: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { productId } = await params
  const id = parseInt(productId)
  if (isNaN(id)) notFound()

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

  const [product, history] = await Promise.all([
    getProductDetail(id, portalUser.brand_id),
    getProductBattleHistory(id),
  ])
  if (!product) notFound()

  const claimedIds = subscription?.claimed_product_ids ?? []
  const isClaimed = portalUser.role === 'dough_admin' || claimedIds.includes(id)

  return (
    <ProductDetailClient
      portalUser={portalUser}
      product={product}
      history={history}
      isClaimed={isClaimed}
    />
  )
}
