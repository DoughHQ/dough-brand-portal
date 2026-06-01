import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser, getBrand, getSubscription, getProductDetail, getProductBattleHistory } from '@/lib/queries'
import ProductDetailClient from './ProductDetailClient'

interface Props {
  params: Promise<{ productId: string }>
  searchParams: Promise<{ brand_id?: string }>
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { productId } = await params
  const { brand_id } = await searchParams
  const impersonatedBrandId = brand_id ? parseInt(brand_id) : null

  const id = parseInt(productId)
  if (isNaN(id)) notFound()

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser) redirect('/login')

  const targetBrandId = impersonatedBrandId ?? portalUser.brand_id

  const [brand, subscription] = await Promise.all([
    getBrand(targetBrandId),
    getSubscription(targetBrandId),
  ])
  if (!brand) redirect('/login')

  const [product, history, barcode] = await Promise.all([
    getProductDetail(id, targetBrandId),
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
      isImpersonating={!!impersonatedBrandId}
      barcode={barcode}
    />
  )
}
