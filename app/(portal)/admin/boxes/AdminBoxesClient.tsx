'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import {
  boxStatusLabel,
  tabForBoxStatus,
  BOX_STATUS_TONE,
  type BoxStatus,
  type BoxTab,
  type OperatorBoxRow,
} from '@/lib/box/operator'
import { listOperatorBoxesAction } from './actions'

type Props = {
  initialRows: OperatorBoxRow[]
  loadError: string | null
}

const TAB_KEYS: BoxTab[] = ['draft', 'live', 'closed']
const TAB_LABELS: Record<BoxTab, string> = {
  draft: 'Draft',
  live: 'Live',
  closed: 'Closed',
}

const GRID = 'minmax(220px, 2.4fr) 130px 130px 120px 110px'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function parseTab(raw: string | null): BoxTab {
  if (raw === 'draft' || raw === 'live' || raw === 'closed') return raw
  return 'draft'
}

function StatusBadge({ status }: { status: BoxStatus }) {
  const tone = BOX_STATUS_TONE[status]
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 'var(--r-sm)',
        background: tone.bg,
        color: tone.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {boxStatusLabel(status)}
    </span>
  )
}

export default function AdminBoxesClient({ initialRows, loadError }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<OperatorBoxRow[]>(initialRows)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [error, setError] = useState<string | null>(loadError)
  const [pending, startTransition] = useTransition()

  const activeTab = parseTab(searchParams.get('tab'))

  function setTab(tab: BoxTab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/admin/boxes?${params.toString()}`)
  }

  const reload = useCallback((archived: boolean) => {
    startTransition(async () => {
      const result = await listOperatorBoxesAction({ includeArchived: archived })
      if (result.ok) {
        setRows(result.rows)
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }, [])

  function toggleArchived() {
    const next = !includeArchived
    setIncludeArchived(next)
    reload(next)
  }

  const counts = useMemo(() => {
    const c: Record<BoxTab, number> = { draft: 0, live: 0, closed: 0 }
    for (const r of rows) c[tabForBoxStatus(r.status)] += 1
    return c
  }, [rows])

  const visible = useMemo(
    () => rows.filter((r) => tabForBoxStatus(r.status) === activeTab),
    [rows, activeTab]
  )

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '28px 28px 80px',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 32,
              fontWeight: 400,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Sampling boxes
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.45 }}>
            Open claim windows, track shipping, and close out box studies.
          </p>
        </div>
        <Link
          href="/studies/box/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--sage)',
            color: 'var(--white)',
            border: 'none',
            borderRadius: 'var(--r-sm)',
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span aria-hidden style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>
            +
          </span>
          New box
        </Link>
      </header>

      {error ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 20 }}>
          {error}
        </p>
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div role="tablist" style={{ display: 'flex', gap: 4 }}>
          {TAB_KEYS.map((tab) => {
            const active = tab === activeTab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(tab)}
                style={{
                  border: 'none',
                  background: active ? 'var(--sage-soft)' : 'transparent',
                  color: active ? 'var(--sage-dark)' : 'var(--ink-50)',
                  borderRadius: 'var(--r-sm)',
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                {TAB_LABELS[tab]}
                <span style={{ marginLeft: 6, opacity: 0.6 }}>{counts[tab]}</span>
              </button>
            )
          })}
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--ink-50)',
            cursor: 'pointer',
          }}
        >
          <input type="checkbox" checked={includeArchived} onChange={toggleArchived} />
          Include archived
        </label>
      </div>

      {visible.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            border: '1px dashed var(--ink-10)',
            borderRadius: 'var(--r-lg)',
            background: 'var(--white)',
            color: 'var(--ink-50)',
            fontSize: 14,
          }}
        >
          {pending ? 'Loading…' : `No ${TAB_LABELS[activeTab].toLowerCase()} boxes.`}
        </div>
      ) : (
        <div
          style={{
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
            background: 'var(--white)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: 16,
              padding: '12px 16px',
              borderBottom: '1px solid var(--ink-10)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
            }}
          >
            <div>Box</div>
            <div>Status</div>
            <div>Seats</div>
            <div>Field</div>
            <div>Created</div>
          </div>
          {visible.map((r) => (
            <Link
              key={r.box_id}
              href={`/admin/boxes/${r.box_id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: 16,
                alignItems: 'center',
                padding: '14px 16px',
                borderTop: '1px solid var(--cb-border-soft, var(--ink-10))',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 2 }}>
                  {r.brand_name || 'Unknown brand'}
                  {r.category_name ? ` · ${r.category_name}` : ''}
                  {r.blind_sponsor ? ' · blind' : ''}
                </div>
              </div>
              <div>
                <StatusBadge status={r.status} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink)' }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{r.seats_available}</span>
                <span style={{ color: 'var(--ink-30)' }}> / {r.physical_units}</span>
                <div style={{ fontSize: 11, color: 'var(--ink-50)', marginTop: 2 }}>
                  {r.seats_completed} done
                  {r.seats_active > 0 ? ` · ${r.seats_active} active` : ''}
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
                {r.field_size} product{r.field_size === 1 ? '' : 's'}
                {r.session_count === 2 ? ' · 2 sessions' : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                {relativeTime(r.created_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
