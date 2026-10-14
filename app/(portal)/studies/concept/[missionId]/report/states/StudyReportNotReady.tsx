import { createServerSupabaseClient } from '@/lib/supabase-server'
import { loadStudyEndPreview } from '@/lib/studies/loadStudyEndPreview'
import {
  studyReportFallbackStatus,
  studyReportStatus,
} from '@/lib/studies/studyReportStatus'
import StudyReportStatusCard from '@/components/studies/StudyReportStatusCard'
import ConceptReportStateCard from './ConceptReportStateCard'

type Props = {
  missionId: string
  backHref: string
}

export default async function StudyReportNotReady({ missionId, backHref }: Props) {
  const supabase = await createServerSupabaseClient()
  const loaded = await loadStudyEndPreview(supabase, missionId)
  if (!loaded.ok) {
    const fallback = studyReportFallbackStatus()
    return (
      <ConceptReportStateCard
        title={fallback.title}
        body={fallback.body}
        backHref={backHref}
      />
    )
  }

  const status = studyReportStatus(loaded.preview)
  return (
    <StudyReportStatusCard
      missionId={missionId}
      title="This study"
      status={status}
      backHref={backHref}
    />
  )
}
