import { redirect } from 'next/navigation'
import { getBrand, getBrandMissions } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import IhutListClient from './IhutListClient'
import AdminIhutClient from './AdminIhutClient'

export default async function IhutPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope

  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    return <AdminIhutClient />
  }

  const [brand, missions] = await Promise.all([
    getBrand(effectiveBrandId),
    getBrandMissions(effectiveBrandId),
  ])
  if (!brand) redirect('/login')

  return (
    <IhutListClient
      portalUser={portalUser}
      brand={brand}
      missions={missions}
      isImpersonating={isImpersonating}
    />
  )
}
