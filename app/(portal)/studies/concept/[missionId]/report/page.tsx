import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchConceptMissionReport } from '@/lib/conceptReport/fetchReport'
import { ConceptTestReportDeck } from '@/components/conceptReport/ConceptTestReportDeck'
import { parseConceptTestReport } from '@/lib/conceptReport/conceptTestTypes'
import conceptTestFixture from '../../../../../../concept-core-fixtures/report_concept_test.json'
import ConceptReportPreviewBanner from './states/ConceptReportPreviewBanner'
import ConceptReportStateCard from './states/ConceptReportStateCard'
import StudyReportNotReady from './states/StudyReportNotReady'
import { messageForCode } from './states/conceptReportMessages'
import { tryParseConceptTest } from './states/tryParseConceptTest'

type Props = {
  params: Promise<{ missionId: string }>
  searchParams: Promise<{ preview?: string }>
}

export default async function ConceptStudyReportPage({
  params,
  searchParams,
}: Props) {
  const { missionId } = await params
  const sp = await searchParams
  const backHref = '/studies'

  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  if (
    sp.preview === 'sample' ||
    (sp.preview === 'core' && scope.portalUser.role === 'dough_admin')
  ) {
    const parsed = parseConceptTestReport(conceptTestFixture)
    if (parsed) {
      return (
        <>
          <ConceptReportPreviewBanner />
          <ConceptTestReportDeck report={parsed} backHref={backHref} />
        </>
      )
    }
  }

  const supabase = await createServerSupabaseClient()

  const core = await tryParseConceptTest(supabase, missionId)
  if (core) {
    return <ConceptTestReportDeck report={core} backHref={backHref} />
  }

  const result = await fetchConceptMissionReport(supabase, missionId)
  if (!result.ok) {
    if (result.code === 'NO_REPORT_YET') {
      return <StudyReportNotReady missionId={missionId} backHref={backHref} />
    }
    const copy = messageForCode(result.code)
    return (
      <ConceptReportStateCard title={copy.title} body={copy.body} backHref={backHref} />
    )
  }

  return (
    <StudyReportNotReady missionId={missionId} backHref={backHref} />
  )
}
