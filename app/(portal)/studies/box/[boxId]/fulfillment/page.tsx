import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import BrandFulfillmentPanel from './BrandFulfillmentPanel'

type Props = {
  params: Promise<{ boxId: string }>
}

export default async function BrandBoxFulfillmentPage({ params }: Props) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { boxId } = await params
  if (!boxId) notFound()

  const supabase = await createServerSupabaseClient()
  const { data: box } = await supabase
    .from('sampling_boxes')
    .select('id, mission_id')
    .eq('id', boxId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!box) notFound()

  let title = 'Box packing'
  const { data: mission } = await supabase
    .from('missions')
    .select('title')
    .eq('id', box.mission_id)
    .maybeSingle()
  if (mission?.title?.trim()) title = mission.title.trim()

  return (
    <div
      style={{
        maxWidth: 880,
        margin: '0 auto',
        padding: '32px 24px 64px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <Link
        href="/studies"
        style={{ fontSize: 12, color: 'var(--ink-faint)', textDecoration: 'none' }}
      >
        ← Back to studies
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 400,
          margin: '14px 0 6px',
          color: 'var(--ink)',
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: '0 0 22px' }}>
        Packing labels and shipping for this tasting box.
      </p>
      <BrandFulfillmentPanel boxId={boxId} />
    </div>
  )
}
