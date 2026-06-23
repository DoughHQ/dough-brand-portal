import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser, getBrand, getBrandMissions } from '@/lib/queries'
import IhutListClient from './IhutListClient'
import AdminIhutClient from './AdminIhutClient'

interface PageProps {
  searchParams: Promise<{ brand_id?: string }>
}

export default async function IhutPage({ searchParams }: PageProps) {
  const { brand_id } = await searchParams

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser) redirect('/login')

  const parsedBrandId = brand_id ? parseInt(brand_id, 10) : NaN
  const impersonatedBrandId =
    portalUser.role === 'dough_admin' && Number.isFinite(parsedBrandId) ? parsedBrandId : null

  if (portalUser.role === 'dough_admin' && !impersonatedBrandId) {
    return <AdminIhutClient />
  }

  const targetBrandId = impersonatedBrandId ?? portalUser.brand_id

  const [brand, missions] = await Promise.all([
    getBrand(targetBrandId),
    getBrandMissions(targetBrandId),
  ])
  if (!brand) redirect('/login')

  return (
    <IhutListClient
      portalUser={portalUser}
      brand={brand}
      missions={missions}
      isImpersonating={portalUser.role === 'dough_admin' && !!impersonatedBrandId}
    />
  )
}
