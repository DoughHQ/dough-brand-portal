import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import {
  CategoryReadinessError,
  fetchReadinessL2,
  fetchReadinessL3,
} from '@/lib/categoryReadiness'
import {
  compareGroupBattlesCaption,
  intelligenceL2Href,
  relativeTime,
  studyBattlesCaption,
} from '@/lib/categoryReadiness.shared'
import type { ReadinessRow } from '@/lib/categoryReadiness.shared'
import ReadinessTable from '../../_components/ReadinessTable'

type Props = {
  params: Promise<{ slug: string }>
}

function parseNodeId(slug: string): number | null {
  if (!/^\d+$/.test(slug)) return null
  const n = Number(slug)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

function ParentRow({ row }: { row: ReadinessRow }) {
  const threshold = row.raterThreshold
  const studyLine = studyBattlesCaption(row.studyBattlesExcluded)
  const compareLine = compareGroupBattlesCaption(row.compareGroupBattles)
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        padding: '18px 20px',
        marginBottom: 28,
        display: 'grid',
        gridTemplateColumns: '1fr 140px 100px 100px 120px 110px',
        gap: 16,
        alignItems: 'center',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginBottom: 4,
          }}
        >
          {row.l1Name ?? 'L2'}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            fontWeight: 400,
            color: 'var(--ink)',
          }}
        >
          {row.name}
        </div>
        {studyLine && (
          <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 6 }}>
            {studyLine}
          </div>
        )}
        {compareLine && (
          <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 4 }}>
            {compareLine}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>
          Raters
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {row.distinctRaters.toLocaleString()}
          <span style={{ fontWeight: 400, color: 'var(--ink-30)', fontSize: 13 }}>
            {' '}
            / {threshold.toLocaleString()}
          </span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>
          Battles
        </div>
        <div style={{ fontSize: 16, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
          {row.battles ? row.battles.toLocaleString() : '—'}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>
          Products
        </div>
        <div style={{ fontSize: 16, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
          {row.productsBattled ? row.productsBattled.toLocaleString() : '—'}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>
          7d / 30d
        </div>
        <div style={{ fontSize: 16, color: 'var(--ink-50)', fontVariantNumeric: 'tabular-nums' }}>
          {row.raters7d.toLocaleString()} / {row.raters30d.toLocaleString()}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>
          Last battle
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-50)' }}>
          {relativeTime(row.lastBattleAt) || '—'}
        </div>
      </div>
    </div>
  )
}

export default async function CategoryReadinessL3Page({ params }: Props) {
  const { slug } = await params
  const l2NodeId = parseNodeId(slug)
  if (l2NodeId == null) redirect('/admin/categories')

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  let l2Rows
  let l3Rows
  try {
    ;[l2Rows, l3Rows] = await Promise.all([
      fetchReadinessL2(),
      fetchReadinessL3(l2NodeId),
    ])
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
        <Link
          href="/admin/categories"
          style={{ fontSize: 12, color: 'var(--ink-50)', textDecoration: 'none' }}
        >
          ← Category readiness
        </Link>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', marginTop: 16 }}>{message}</p>
      </div>
    )
  }

  const parent = l2Rows.find((row) => row.nodeId === l2NodeId)
  if (!parent) redirect('/admin/categories')

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '36px 32px 96px',
      }}
    >
      <Link
        href="/admin/categories"
        style={{
          fontSize: 12,
          color: 'var(--ink-50)',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 20,
        }}
      >
        ← Category readiness
      </Link>

      <div style={{ marginBottom: 8 }}>
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
          L3 readiness
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
          {parent.name}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-30)', margin: '0 0 20px' }}>
          Parent totals come from the L2 query — they are not a sum of the rows
          below. Updated just now.
        </p>
      </div>

      <ParentRow row={parent} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 16,
        }}
      >
        <Link
          href={intelligenceL2Href(parent.name)}
          style={{
            fontSize: 13,
            color: 'var(--sage, #3E6B4A)',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Open L2 rankings →
        </Link>
      </div>

      <ReadinessTable
        rows={l3Rows}
        level="l3"
        parentL2Name={parent.name}
        hideEmptyDefault={false}
      />
    </div>
  )
}
