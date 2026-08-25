import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import {
  CategoryReadinessError,
  fetchReadinessL2,
} from '@/lib/categoryReadiness'
import ReadinessTable from './_components/ReadinessTable'

export default async function CategoryReadinessIndexPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  let rows
  try {
    rows = await fetchReadinessL2()
  } catch (err) {
    if (err instanceof CategoryReadinessError && err.adminOnly) {
      redirect('/dashboard')
    }
    const message = err instanceof Error ? err.message : 'Could not load category readiness.'
    return (
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '36px 32px 96px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '0 0 12px',
          }}
        >
          Category readiness
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', maxWidth: 560, lineHeight: 1.55 }}>
          Couldn’t load readiness: {message}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '36px 32px 96px',
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--ink-30)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Admin
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '0 0 8px',
          }}
        >
          Category readiness
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-50)',
            maxWidth: 560,
            lineHeight: 1.55,
            margin: '0 0 6px',
          }}
        >
          Distinct people who have battled in each category — not battle volume.
          A category is sellable only after enough unique raters.
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-30)', margin: 0 }}>
          Updated just now · empty and building are expected.
        </p>
      </div>

      <ReadinessTable rows={rows} level="l2" hideEmptyDefault />
    </div>
  )
}
