import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { aggregateCategoryProducts } from '@/lib/categoryIntelligence'
import CategoryIntelligenceClient from '../CategoryIntelligenceClient'
import L3IntelligenceClient from './L3IntelligenceClient'

interface Props {
  params: Promise<{ slug: string; l3slug: string }>
}

export default async function L3IntelligencePage({ params }: Props) {
  const { slug, l3slug } = await params
  const l2Name = decodeURIComponent(slug)
  const l3Name = decodeURIComponent(l3slug)

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const { data: productsRaw, error } = await supabase.rpc('get_l3_category_intelligence', {
    p_l3_name: l3Name,
  })

  if (error) {
    console.error('[l3-category-intelligence]', error)
    return (
      <CategoryIntelligenceClient
        l2Name={l2Name}
        products={[]}
        l3Breakdown={[]}
        scopeNote={`L3: ${l3Name}`}
        loadError={error.message}
      />
    )
  }

  if ((productsRaw?.length ?? 0) > 0) {
    return (
      <L3IntelligenceClient
        l2Name={l2Name}
        l3Name={l3Name}
        products={productsRaw ?? []}
      />
    )
  }

  const aggregated = aggregateCategoryProducts([])

  return (
    <CategoryIntelligenceClient
      l2Name={`${l2Name} · ${l3Name}`}
      products={aggregated}
      l3Breakdown={[]}
      scopeNote={`No battled products in L3 “${l3Name}” yet.`}
      loadError={null}
    />
  )
}
