import Link from 'next/link'
import type { OperatorBoxRow } from '@/lib/box/operator'
import { StatusBadge } from './BoxStatusBadge'
import { GRID, relativeTime } from './boxesModel'

export function AdminBoxesTable({ rows }: { rows: OperatorBoxRow[] }) {
  return (
    <div
      style={{
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        background: 'var(--paper)',
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
      {rows.map((r) => (
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
  )
}
