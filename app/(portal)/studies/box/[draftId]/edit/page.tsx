import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import BoxDraftLoader from '../../BoxDraftLoader'

export default async function EditBoxStudyPage({
  params,
}: {
  params: Promise<{ draftId: string }>
}) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')
  const { draftId } = await params

  return (
    <BoxDraftLoader
      draftId={draftId}
      effectiveBrandId={scope.effectiveBrandId}
      isImpersonating={scope.isImpersonating}
    />
  )
}
