import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import CategoryIntelligenceClient from './CategoryIntelligenceClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CategoryIntelligencePage({ params }: Props) {
  const { slug } = await params
  const l2Name = decodeURIComponent(slug)

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const [{ data: products }, { data: l3Breakdown }] = await Promise.all([
    supabase.rpc('get_category_intelligence', { p_l2_name: l2Name }),
    supabase.rpc('get_category_l3_breakdown', { p_l2_name: l2Name }),
  ])

  if (!products || products.length === 0) notFound()

  return (
    <CategoryIntelligenceClient
      l2Name={l2Name}
      products={products}
      l3Breakdown={l3Breakdown ?? []}
    />
  )
}
