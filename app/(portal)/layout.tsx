import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser, getBrand, getSubscription } from '@/lib/queries'
import PortalLayoutClient from './PortalLayoutClient'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
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

  const claimedCount = subscription?.claimed_product_ids?.length ?? 0

  return (
    <PortalLayoutClient
      brand={brand}
      portalUser={portalUser}
      subscription={subscription}
      claimedCount={claimedCount}
    >
      {children}
    </PortalLayoutClient>
  )
}
