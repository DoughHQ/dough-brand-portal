import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser, getBrand, getMissionWizardDraft } from '@/lib/queries'
import IhutWizardClient from '../IhutWizardClient'

interface PageProps {
  searchParams: Promise<{ brand_id?: string; missionId?: string }>
}

export default async function IhutNewPage({ searchParams }: PageProps) {
  const { brand_id, missionId } = await searchParams

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser) redirect('/login')

  const parsedBrandId = brand_id ? parseInt(brand_id, 10) : NaN
  const impersonatedBrandId =
    portalUser.role === 'dough_admin' && Number.isFinite(parsedBrandId) ? parsedBrandId : null

  if (portalUser.role === 'dough_admin' && !impersonatedBrandId) {
    redirect('/ihut')
  }

  const targetBrandId = impersonatedBrandId ?? portalUser.brand_id

  const brand = await getBrand(targetBrandId)
  if (!brand) redirect('/login')

  const resumedDraft = missionId
    ? await getMissionWizardDraft(missionId, targetBrandId)
    : null

  if (missionId && !resumedDraft) redirect('/ihut')

  return (
    <IhutWizardClient
      portalUser={portalUser}
      brand={brand}
      isImpersonating={portalUser.role === 'dough_admin' && !!impersonatedBrandId}
      resumedDraft={resumedDraft}
    />
  )
}
