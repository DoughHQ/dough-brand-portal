import Link from 'next/link'
import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { getCompareGroupDetail, getCompareGroupMetrics } from '@/lib/compareGroups'
import DetailShell from './_components/DetailShell'

export default async function CompareGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isFinite(id)) notFound()

  const [detailResult, metricsResult] = await Promise.allSettled([
    getCompareGroupDetail(id),
    getCompareGroupMetrics(id),
  ])

  if (detailResult.status === 'rejected') {
    const err = detailResult.reason as Error & { code?: string }
    if (err?.code === 'P0002' || /not found/i.test(err?.message ?? '')) {
      notFound()
    }
    throw detailResult.reason
  }

  const detail = detailResult.value
  const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value : null

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '36px 32px 96px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <Link
        href="/admin/compare-groups"
        style={{
          display: 'inline-block',
          marginBottom: 20,
          fontSize: 14,
          color: 'var(--sage)',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        ← Compare Groups
      </Link>
      <DetailShell id={id} detail={detail} metrics={metrics} />
    </div>
  )
}
