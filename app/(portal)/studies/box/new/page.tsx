import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { createEmptyBoxDraft } from '@/lib/box/defaults'
import BoxStudyClient from '../BoxStudyClient'

export default async function NewBoxStudyPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const draft = createEmptyBoxDraft(scope.effectiveBrandId)
  return (
    <BoxStudyClient
      initialDraft={draft}
      mode="new"
      isImpersonating={scope.isImpersonating}
    />
  )
}
