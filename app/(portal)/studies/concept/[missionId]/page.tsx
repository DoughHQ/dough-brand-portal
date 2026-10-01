import Link from 'next/link'
import { redirect } from 'next/navigation'
import { fetchStudyOrder } from '@/lib/checkout/load'
import { checkoutHref } from '@/lib/checkout/status'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type Props = {
  params: Promise<{ missionId: string }>
}

/** After payment, the study page. An unpaid order goes to checkout. */
export default async function ConceptStudyStatusPage({ params }: Props) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { missionId } = await params
  const supabase = await createServerSupabaseClient()
  const order = await fetchStudyOrder(supabase, missionId)
  if (order?.status === 'awaiting_payment') {
    redirect(checkoutHref(missionId))
  }

  const live = order?.status === 'paid' || order?.status === 'waived'
  const reportHref = `/studies/concept/${missionId}/report`

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 640,
        margin: '0 auto',
        padding: '64px 28px',
      }}
    >
      <Link
        href="/studies"
        style={{ fontSize: 12, color: 'var(--ink-50)', textDecoration: 'none' }}
      >
        ← Studies
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 32,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '12px 0 8px',
        }}
      >
        {live ? 'Your study is live' : 'Concept study'}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.5, margin: '0 0 20px' }}>
        {live
          ? 'Respondents can take it. The report appears once enough people finish.'
          : 'This study is not live. If it has an order, checkout is where it gets paid.'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {live ? (
          <Link
            href={reportHref}
            style={{
              display: 'inline-block',
              background: 'var(--sage)',
              color: 'var(--white)',
              fontSize: 13,
              fontWeight: 600,
              padding: '10px 18px',
              borderRadius: 'var(--r-sm)',
              textDecoration: 'none',
            }}
          >
            View report
          </Link>
        ) : null}
        <Link
          href="/studies"
          style={{
            display: 'inline-block',
            background: 'var(--paper)',
            color: 'var(--sage-dark)',
            border: '1px solid var(--mist)',
            fontSize: 13,
            fontWeight: 500,
            padding: '10px 18px',
            borderRadius: 'var(--r-sm)',
            textDecoration: 'none',
          }}
        >
          Back to studies
        </Link>
      </div>
    </div>
  )
}
