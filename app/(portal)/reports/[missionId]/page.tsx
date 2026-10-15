import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import {
  EXPERIENCED_PREVIEW_MISSIONS,
  fetchExperiencedMissionReport,
} from '@/lib/experiencedReport'
import type { ExperiencedReportErrorCode } from '@/lib/experiencedReport/types'
import { ExperiencedReportDeck } from '@/components/experiencedReport/ExperiencedReportDeck'
import StudyReportStatusCard from '@/components/studies/StudyReportStatusCard'
import { loadStudyEndPreview } from '@/lib/studies/loadStudyEndPreview'
import {
  studyReportFallbackStatus,
  studyReportStatus,
} from '@/lib/studies/studyReportStatus'
import { packingHref, resolveBoxIdForMission } from '@/lib/box/brandFulfillment'

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
        background: 'var(--surface)',
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

function messageForCode(code: ExperiencedReportErrorCode): { title: string; body: string } {
  switch (code) {
    case 'NO_REPORT_YET':
      return studyReportFallbackStatus()
    case 'FORBIDDEN':
    case 'NOT_A_PORTAL_USER':
      return {
        title: 'No access',
        body: "You don't have access to this report.",
      }
    case 'NOT_AUTHENTICATED':
      return {
        title: 'Sign in required',
        body: 'Sign in to view this study report.',
      }
    default:
      return {
        title: "Couldn't load report",
        body: 'Something went wrong loading this report. Try again in a moment.',
      }
  }
}

const PREVIEW_ALIASES: Record<string, string> = {
  '1': EXPERIENCED_PREVIEW_MISSIONS.competitive_map,
  competitive_map: EXPERIENCED_PREVIEW_MISSIONS.competitive_map,
  competitive: EXPERIENCED_PREVIEW_MISSIONS.competitive_map,
  value_sensitivity: EXPERIENCED_PREVIEW_MISSIONS.value_sensitivity,
  value: EXPERIENCED_PREVIEW_MISSIONS.value_sensitivity,
  head_to_head_loyalty: EXPERIENCED_PREVIEW_MISSIONS.head_to_head_loyalty,
  loyalty: EXPERIENCED_PREVIEW_MISSIONS.head_to_head_loyalty,
  h2h: EXPERIENCED_PREVIEW_MISSIONS.head_to_head_loyalty,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { missionId } = await params
  const scope = await getPortalBrandScope()
  if (!scope) return { title: 'Study report' }

  const supabase = await createServerSupabaseClient()
  const result = await fetchExperiencedMissionReport(supabase, missionId)
  if (!result.ok) {
    const copy = messageForCode(result.code)
    return { title: copy.title }
  }
  const name = result.envelope.report.focal_product.name
  return { title: `${name} · Study report` }
}

export default async function MissionReportPage({ params, searchParams }: Props) {
  const { missionId } = await params
  const sp = await searchParams
  const backHref = '/studies'

  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  let effectiveMissionId = missionId
  let previewLabel: string | null = null

  if (sp.preview && scope.portalUser.role === 'dough_admin') {
    const mapped = PREVIEW_ALIASES[sp.preview]
    if (mapped) {
      effectiveMissionId = mapped
      previewLabel = sp.preview
    } else if (
      Object.values(EXPERIENCED_PREVIEW_MISSIONS).includes(
        sp.preview as (typeof EXPERIENCED_PREVIEW_MISSIONS)[keyof typeof EXPERIENCED_PREVIEW_MISSIONS]
      )
    ) {
      effectiveMissionId = sp.preview
      previewLabel = 'seeded'
    }
  }

  const supabase = await createServerSupabaseClient()
  const [result, boxId] = await Promise.all([
    fetchExperiencedMissionReport(supabase, effectiveMissionId),
    resolveBoxIdForMission(supabase, missionId),
  ])
  const packHref = boxId ? packingHref(boxId) : null

  if (!result.ok) {
    if (result.code === 'NO_REPORT_YET' && !previewLabel) {
      const loaded = await loadStudyEndPreview(supabase, missionId)
      if (loaded.ok) {
        return (
          <StudyReportStatusCard
            missionId={missionId}
            title="This study"
            status={studyReportStatus(loaded.preview)}
            backHref={backHref}
            packingHref={packHref}
          />
        )
      }
      const fallback = studyReportFallbackStatus()
      return <StateCard title={fallback.title} body={fallback.body} backHref={backHref} />
    }
    const copy = messageForCode(result.code)
    return <StateCard title={copy.title} body={copy.body} backHref={backHref} />
  }

  return (
    <>
      {previewLabel ? (
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
          Admin preview ({previewLabel}) — seeded simulated mission {effectiveMissionId}
        </div>
      ) : null}
      {packHref ? (
        <div
          className="no-print"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            textAlign: 'center',
            padding: '10px 12px',
            borderBottom: '1px solid var(--ink-10)',
            background: 'var(--paper)',
          }}
        >
          <Link href={packHref} style={{ color: 'var(--heading)', fontWeight: 600 }}>
            Pack &amp; ship labels →
          </Link>
        </div>
      ) : null}
      <ExperiencedReportDeck envelope={result.envelope} backHref={backHref} />
    </>
  )
}
