import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchConceptMissionReport } from '@/lib/conceptReport/fetchReport'
import { mergeCombatantDisplay } from '@/lib/conceptReport/mergeCombatants'
import { conceptReportFixture, conceptReportThinSampleFixture } from '@/lib/conceptReport/fixture'
import type { ConceptReportErrorCode } from '@/lib/conceptReport/types'
import { ConceptReportDeck } from '@/components/conceptReport/ConceptReportDeck'

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
        body: 'Sign in to view this concept study report.',
      }
    default:
      return {
        title: "Couldn't load report",
        body: 'Something went wrong loading this report. Try again in a moment.',
      }
  }
}

export default async function ConceptStudyReportPage({ params, searchParams }: Props) {
  const { missionId } = await params
  const sp = await searchParams
  const backHref = '/studies'

  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  if (
    (sp.preview === '1' || sp.preview === 'thin' || sp.preview === 'sim') &&
    scope.portalUser.role === 'dough_admin'
  ) {
    let fixture =
      sp.preview === 'thin'
        ? conceptReportThinSampleFixture(missionId)
        : conceptReportFixture(missionId)
    if (sp.preview === 'sim') {
      fixture = { ...fixture, is_simulated: true }
    }
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
          Preview fixture (
          {sp.preview === 'thin' ? 'thin sample' : sp.preview === 'sim' ? 'simulated' : 'full'}) —
          not a live frozen report
        </div>
        <ConceptReportDeck report={fixture} backHref={backHref} />
      </>
    )
  }

  const supabase = await createServerSupabaseClient()
  const result = await fetchConceptMissionReport(supabase, missionId)

  if (!result.ok) {
    const copy = messageForCode(result.code)
    return <StateCard title={copy.title} body={copy.body} backHref={backHref} />
  }

  const report = await mergeCombatantDisplay(supabase, missionId, result.report)
  return <ConceptReportDeck report={report} backHref={backHref} />
}
