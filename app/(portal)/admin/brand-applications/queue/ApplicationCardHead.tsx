import type { BrandApplication } from '@/lib/brandApplications'
import { formatWhen } from './applicationCardFormat'
import { DecisionBadge } from './DecisionBadge'
import { StatusChip } from './StatusChip'

export function ApplicationCardHead({
  row,
  pending,
}: {
  row: BrandApplication
  pending: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          {row.contact_name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 3 }}>
          <a
            href={`mailto:${encodeURIComponent(row.contact_email)}`}
            style={{ color: 'var(--sage)', fontWeight: 500 }}
          >
            {row.contact_email}
          </a>
          {row.role_title ? (
            <span style={{ color: 'var(--ink-30)' }}> · {row.role_title}</span>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 8,
          }}
        >
          {row.domain_match === true ? (
            <DecisionBadge tone="sage">Email matches website</DecisionBadge>
          ) : row.domain_match === false ? (
            <DecisionBadge tone="amber">Email domain ≠ website</DecisionBadge>
          ) : (
            <DecisionBadge tone="ink">No website</DecisionBadge>
          )}
          {row.free_email ? (
            <DecisionBadge tone="amber">Personal email</DecisionBadge>
          ) : null}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <StatusChip row={row} />
        <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 6 }}>
          Applied {formatWhen(row.created_at)}
        </div>
        {!pending && row.reviewed_at ? (
          <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
            Reviewed {formatWhen(row.reviewed_at)}
          </div>
        ) : null}
        {pending && row.alert_sent_at ? (
          <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 2 }}>
            Alert sent {formatWhen(row.alert_sent_at)}
          </div>
        ) : null}
        {pending && !row.alert_sent_at && row.alert_last_error ? (
          <div style={{ fontSize: 12, color: 'var(--amber, #a66a14)', marginTop: 2 }}>
            Alert failing ({row.alert_attempts}/5)
          </div>
        ) : null}
      </div>
    </div>
  )
}
