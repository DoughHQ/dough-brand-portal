import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchConceptMissionReport } from '@/lib/conceptReport/fetchReport'
import type { ConceptReportErrorCode } from '@/lib/conceptReport/types'
import { ConceptTestReportDeck } from '@/components/conceptReport/ConceptTestReportDeck'
import {
  isConceptTestReportPayload,
  parseConceptTestReport,
} from '@/lib/conceptReport/conceptTestTypes'
import conceptTestFixture from '../../../../../../concept-core-fixtures/report_concept_test.json'

type Props = {
  params: Promise<{ missionId: string }>
  searchParams: Promise<{ preview?: string }>
}

function StateCard({
  title,
  body,
  backHref,
}: {
  title: string
  body: string
  backHref: string
}) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '64px 28px',
        fontFamily: 'var(--font-sans)',
        background: 'var(--cream)',
        minHeight: '100vh',
      }}
    >
      <Link
        href={backHref}
        style={{ fontSize: 12, color: 'var(--ink-faint)', textDecoration: 'none' }}
      >
        ← Back to studies
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 400,
          margin: '16px 0 12px',
          color: 'var(--ink)',
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-muted)', margin: 0 }}>{body}</p>
    </div>
  )
}

function messageForCode(code: ConceptReportErrorCode): { title: string; body: string } {
  switch (code) {
    case 'NO_REPORT_YET':
      return {
        title: "Report isn't ready yet",
        body: "This study's report isn't ready yet. A frozen snapshot appears after compute runs for this mission. This page only reads that snapshot — it never recomputes.",
      }
    case 'FORBIDDEN':
    case 'NOT_A_PORTAL_USER':
      return {
        title: 'No access',
        body: "You don't have access to this report.",
      }
    case 'NOT_AUTHENTICATED':
      return {
        title: 'Sign in required',
        body: 'Sign in to view this report.',
      }
    default:
      return {
        title: "Couldn't load report",
        body: 'Something went wrong loading this report. Try again in a moment.',
      }
  }
}

async function tryParseConceptTest(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  missionId: string
) {
  const { data } = await supabase.rpc('get_concept_mission_report', {
    p_mission_id: missionId,
  })
  if (isConceptTestReportPayload(data)) {
    return parseConceptTestReport(data)
  }
  const envelope =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null
  const inner = envelope?.report ?? envelope?.data ?? data
  if (isConceptTestReportPayload(inner)) {
    return parseConceptTestReport(inner)
  }
  return null
}

export default async function ConceptStudyReportPage({ params, searchParams }: Props) {
  const { missionId } = await params
  const sp = await searchParams
  const backHref = '/studies'

  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  if (sp.preview === 'core' && scope.portalUser.role === 'dough_admin') {
    const parsed = parseConceptTestReport(conceptTestFixture)
    if (parsed) {
      return (
        <>
          <div
            className="no-print"
            style={{
              background: 'var(--amber-soft)',
              color: 'var(--amber)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              textAlign: 'center',
              padding: '8px 12px',
            }}
          >
            Preview fixture (concept_core_v1) — not a live frozen report
          </div>
          <ConceptTestReportDeck report={parsed} backHref={backHref} />
        </>
      )
    }
  }

  const supabase = await createServerSupabaseClient()

  // Prefer concept_test / CORE shape.
  const core = await tryParseConceptTest(supabase, missionId)
  if (core) {
    return <ConceptTestReportDeck report={core} backHref={backHref} />
  }

  const result = await fetchConceptMissionReport(supabase, missionId)
  if (!result.ok) {
    const copy = messageForCode(result.code)
    return <StateCard title={copy.title} body={copy.body} backHref={backHref} />
  }

  // Legacy win_rate reports should not appear for new CORE studies; if one
  // somehow loads, show the not-ready state rather than the old deck.
  return (
    <StateCard
      title="Report isn't ready yet"
      body="This study uses the single concept test. The verdict report appears once enough respondents have finished."
      backHref={backHref}
    />
  )
}
