import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser, getBrand, getSubscription } from '@/lib/queries'
import ReportsClient from './ReportsClient'

interface Props {
  searchParams: Promise<{ brand_id?: string }>
}

export default async function ReportsPage({ searchParams }: Props) {
  const { brand_id } = await searchParams
  const impersonatedBrandId = brand_id ? parseInt(brand_id) : null

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

  const isAdmin = portalUser.role === 'dough_admin'

  return (
    <ReportsClient
      portalUser={portalUser}
      brand={brand}
      subscription={subscription}
      isAdmin={isAdmin}
      isImpersonating={!!impersonatedBrandId}
      brandId={targetBrandId}
    />
  )
}
