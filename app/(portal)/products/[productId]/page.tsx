import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getBrand, getSubscription, getProductDetail, getProductBattleHistory } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import ProductDetailClient from './ProductDetailClient'

interface Props {
  params: Promise<{ productId: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { productId } = await params

  const id = parseInt(productId)
  if (isNaN(id)) notFound()

  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope

  const supabase = await createServerSupabaseClient()

  const [brand, subscription] = await Promise.all([
    getBrand(effectiveBrandId),
    getSubscription(effectiveBrandId),
  ])
  if (!brand) redirect('/login')

  const [product, history, barcode] = await Promise.all([
    getProductDetail(id, effectiveBrandId),
    getProductBattleHistory(id),
    supabase
      .rpc('get_product_primary_barcode', { p_product_id: id })
      .then(({ data }) => data as string | null),
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
      isImpersonating={isImpersonating}
      barcode={barcode}
    />
  )
}
