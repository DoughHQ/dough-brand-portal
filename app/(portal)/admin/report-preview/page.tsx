import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { fetchCategoryReport } from '@/lib/categoryReport/fetch'
import {
  CATEGORY_SCOPES,
  type CategoryMode,
  type CategoryScope,
} from '@/lib/categoryReport/types'
import CategoryDashboardCanvas from '@/components/categoryDashboard/CategoryDashboardCanvas'
import ControlBar from './ControlBar'
import { formatCount } from '@/lib/categoryReport/copy'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function one(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : ''
}

function parseScope(raw: string): CategoryScope | null {
  return (CATEGORY_SCOPES as readonly string[]).includes(raw) ? (raw as CategoryScope) : null
}

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

export default async function CategoryReportPreviewPage({ searchParams }: Props) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const sp = await searchParams
  const scopeRaw = one(sp.scope)
  const idRaw = one(sp.id)
  const mode: CategoryMode = one(sp.mode) === 'brand' ? 'brand' : 'admin'
  const focal = parseId(one(sp.focal))

  const hasQuery = Boolean(scopeRaw || idRaw)
  const scope = parseScope(scopeRaw)
  const scopeId = parseId(idRaw)

  let invalid = false
  if (hasQuery && (scope == null || scopeId == null)) invalid = true

  const result =
    !invalid && scope && scopeId
      ? await fetchCategoryReport({
          scope,
          scopeId,
          focalProductId: focal,
          mode,
        })
      : null

  if (result?.ok === false && result.code === 'ADMIN_ONLY') {
    redirect('/dashboard')
  }

  const report = result?.ok ? result.report : null
  const brandWouldSeeRanking = Boolean(report?.ranking) && mode === 'brand'
  const brandWouldSeeIfToggled =
    mode === 'admin' && report != null
      ? report.gate.passes
      : brandWouldSeeRanking

  return (
    <div style={{ fontFamily: 'var(--font-sans)', minHeight: '100%', background: 'var(--surface)' }}>
      {mode === 'brand' ? (
        <div
          style={{
            background: 'var(--sage-dark)',
            color: 'rgba(250, 248, 243, 0.85)',
            fontSize: 12,
            textAlign: 'center',
            padding: '8px 12px',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          Brand Overview preview — same payload a brand would see · not a live report
        </div>
      ) : report ? (
        <div
          style={{
            background: 'var(--surface-1)',
            borderBottom: '1px solid var(--ink-10)',
            padding: '10px 32px',
            fontSize: 12,
            color: 'var(--ink-50)',
          }}
        >
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Admin instrument</strong>
            {' · '}
            {formatCount(report.evidence.distinct_raters)} / {formatCount(report.evidence.rater_threshold)} raters
            {' · '}
            gate {report.gate.passes ? 'open' : report.gate.reason}
            {' · '}
            {brandWouldSeeIfToggled
              ? 'A brand would see this ranking.'
              : 'A brand would not see a ranking — below floor.'}
          </div>
        </div>
      ) : null}

      <ControlBar
        scope={scope}
        scopeId={scopeId}
        scopeName={report?.meta.scope_name ?? null}
        focal={focal}
        mode={mode}
        catalog={report?.catalog ?? []}
        raters={report?.evidence.distinct_raters}
        threshold={report?.evidence.rater_threshold}
        battles={report?.evidence.battles}
        productsBattled={report?.evidence.products_battled}
      />

      {invalid ? (
        <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, margin: '0 0 8px' }}>
            Couldn’t load that category
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
            Scope must be l2, l3, or compare_group, and id must be a positive integer. Search
            above — don’t guess on every keystroke.
          </p>
        </div>
      ) : result && !result.ok ? (
        <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, margin: '0 0 8px' }}>
            Couldn’t load that category
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
            {result.detail ?? 'The report payload was malformed. No ranking was invented.'}
          </p>
        </div>
      ) : report ? (
        <CategoryDashboardCanvas report={report} />
      ) : (
        <div style={{ maxWidth: 640, margin: '56px auto', padding: '0 32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 32,
              fontWeight: 400,
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
            }}
          >
            Category Overview
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-50)', lineHeight: 1.6, margin: 0 }}>
            Pick a category, then switch to Overview to see the brand surface — honest ranking
            or a refusal when too few distinct people have battled.
          </p>
        </div>
      )}
    </div>
  )
}
