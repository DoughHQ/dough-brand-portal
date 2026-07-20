import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { listCompareGroups } from '@/lib/compareGroups'
import type { CompareGroupScope } from '@/lib/compareGroups.shared'
import ScopeToggle from './_components/ScopeToggle'
import CompareGroupsTable from './_components/CompareGroupsTable'

const SCOPES = new Set<CompareGroupScope>([
  'curated_active',
  'all',
  'synthetic',
  'deprecated',
])

function scopeCaption(scope: CompareGroupScope): string | null {
  if (scope === 'all') return 'All compare groups including synthetic and deprecated.'
  if (scope === 'synthetic')
    return 'Auto-generated single-node groups with no consumer question.'
  if (scope === 'deprecated') return 'Retired groups — no longer used for battles.'
  return null
}

export default async function CompareGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const sp = await searchParams
  const raw = sp.scope ?? 'curated_active'
  const scope: CompareGroupScope = SCOPES.has(raw as CompareGroupScope)
    ? (raw as CompareGroupScope)
    : 'curated_active'

  const { count, groups } = await listCompareGroups(scope)
  const caption = scopeCaption(scope)

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '36px 32px 96px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 32,
              fontWeight: 400,
              color: 'var(--ink)',
              margin: '0 0 6px',
            }}
          >
            Compare Groups
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: '0 0 4px' }}>
            Define who competes and the question shoppers answer.
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink-30)', margin: 0 }}>
            {count} group{count === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href="/admin/compare-groups/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 16px',
            borderRadius: 6,
            background: 'var(--sage)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          Create compare group
        </Link>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Suspense fallback={null}>
          <ScopeToggle current={scope} />
        </Suspense>
      </div>
      {caption && (
        <p style={{ fontSize: 13, color: 'var(--ink-30)', margin: '0 0 16px' }}>
          {caption}
        </p>
      )}

      <CompareGroupsTable groups={groups} />
    </div>
  )
}
