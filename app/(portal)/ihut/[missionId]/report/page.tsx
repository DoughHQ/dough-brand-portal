import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ missionId: string }>
}

/** Legacy path — canonical report lives at /reports/[missionId]. */
export default async function IhutMissionReportRedirect({ params }: Props) {
  const { missionId } = await params
  redirect(`/reports/${missionId}`)
}
