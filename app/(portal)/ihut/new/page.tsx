import { redirect } from 'next/navigation'
import { getBrand, getMissionWizardDraft, fetchPublishedMissionTemplates } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import IhutWizardClient from '../IhutWizardClient'

interface PageProps {
  searchParams: Promise<{ missionId?: string }>
}

export default async function IhutNewPage({ searchParams }: PageProps) {
  const { missionId } = await searchParams

  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope

  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    redirect('/ihut')
  }

  const brand = await getBrand(effectiveBrandId)
  if (!brand) redirect('/login')

  const resumedDraft = missionId
    ? await getMissionWizardDraft(missionId, effectiveBrandId)
    : null

  if (missionId && !resumedDraft) redirect('/ihut')

  const missionTemplates = await fetchPublishedMissionTemplates()

  return (
    <IhutWizardClient
      portalUser={portalUser}
      brand={brand}
      isImpersonating={isImpersonating}
      resumedDraft={resumedDraft}
      missionTemplates={missionTemplates}
    />
  )
}
