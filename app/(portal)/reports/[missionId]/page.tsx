import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import MissionReportClient from './MissionReportClient'

interface Props {
  params: Promise<{ missionId: string }>
}

export default async function MissionReportPage({ params }: Props) {
  const { missionId } = await params

  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  return <MissionReportClient missionId={missionId} backHref="/studies" />
}
