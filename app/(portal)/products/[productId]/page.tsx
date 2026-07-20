import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchProductMaster } from '@/lib/productMaster/fetch'
import ProductMasterClient from './ProductMasterClient'
import { ProductLoadError } from './ProductLoadError'

interface Props {
  params: Promise<{ productId: string }>
}

const SILENT_404_HINTS = new Set([
  'PRODUCT_NOT_FOUND',
  'CROSS_TENANT_ACCESS_DENIED',
  'PRODUCT_IS_BRAND_AGNOSTIC',
])

export default async function ProductDetailPage({ params }: Props) {
  const { productId } = await params
  const id = parseInt(productId, 10)
  if (Number.isNaN(id)) notFound()

  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope
  const supabase = await createServerSupabaseClient()
  const result = await fetchProductMaster(supabase, id)

  if (!result.ok) {
    const hint = result.hint

    if (hint === 'PRODUCT_IS_TOMBSTONE') {
      const canonical = result.details?.canonical_product_id
      if (typeof canonical === 'number') redirect(`/products/${canonical}`)
      if (typeof canonical === 'string' && /^\d+$/.test(canonical)) {
        redirect(`/products/${canonical}`)
      }
    }

    if (hint === 'NOT_A_BRAND_PORTAL_USER') {
      redirect('/login')
    }

    // Don't confirm existence for cross-tenant / missing / brand-agnostic.
    if (hint && SILENT_404_HINTS.has(hint)) {
      notFound()
    }

    // Everything else: show the real error so clicks aren't a dead end.
    console.error('[product-master] load failed', {
      productId: id,
      hint,
      message: result.error.message,
      details: result.details,
    })

    return <ProductLoadError productId={id} error={result.error} hint={hint} />
  }

  return (
    <ProductMasterClient
      portalUser={portalUser}
      effectiveBrandId={effectiveBrandId}
      initial={result.data}
      isImpersonating={isImpersonating}
    />
  )
}
