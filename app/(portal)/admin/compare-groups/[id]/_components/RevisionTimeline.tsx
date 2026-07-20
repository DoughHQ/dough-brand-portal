'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import type { CompareGroupRevision } from '@/lib/compareGroups.shared'
import { fmtJsonValue, relativeTime } from './groupHelpers'

const COLLAPSE_AT = 10

function revisionLabel(r: CompareGroupRevision): string {
  const ct = r.change_type ?? ''
  const field = r.field_name ?? ''

  if (ct === 'create') return 'Created'
  if (ct === 'status_change') return 'Status changed'
  if (ct === 'member_add') return 'Node added'
  if (ct === 'member_remove') return 'Node removed'

  if (ct === 'field_edit') {
    switch (field) {
      case 'consumer_question':
        return 'Question edited'
      case 'compare_group_name_display':
        return 'Name edited'
      case 'compare_group_description':
        return 'Description edited'
      case 'compare_group_type':
        return 'Type edited'
      case 'battle_level':
        return 'Battle level edited'
      case 'status':
        return 'Status edited'
      default:
        return field ? `${field} edited` : 'Field edited'
    }
  }

  return ct || 'Change'
}

function changeDetail(r: CompareGroupRevision): string | null {
  const ct = r.change_type ?? ''

  if (ct === 'member_add' || ct === 'member_remove') {
    const val = ct === 'member_add' ? r.new_value : r.old_value
    return fmtJsonValue(val)
  }

  if (r.old_value != null || r.new_value != null) {
    const oldS = fmtJsonValue(r.old_value)
    const newS = fmtJsonValue(r.new_value)
    if (oldS === newS) return null
    return `${oldS} → ${newS}`
  }

  return null
}

type Props = {
  revisions: CompareGroupRevision[]
}

export default function RevisionTimeline({ revisions }: Props) {
  const [expanded, setExpanded] = useState(false)

  const visible = useMemo(() => {
    if (expanded || revisions.length <= COLLAPSE_AT) return revisions
    return revisions.slice(0, COLLAPSE_AT)
  }, [revisions, expanded])

  if (revisions.length === 0) {
    return (
      <section>
        <div style={sectionTitle}>Revision history</div>
        <div style={emptyBox}>No revisions recorded yet.</div>
      </section>
    )
  }

  return (
    <section>
      <div style={sectionTitle}>Revision history</div>
      <div
        style={{
          border: '1px solid var(--ink-10)',
          borderRadius: 12,
          background: 'var(--white)',
          overflow: 'hidden',
        }}
      >
        {visible.map((r, i) => {
          const detail = changeDetail(r)
          const abs = new Date(r.changed_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })

          return (
            <div
              key={r.revision_id}
              style={{
                padding: '14px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--ink-10)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                  {revisionLabel(r)}
                  {r.version_after != null && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        fontWeight: 400,
                        color: 'var(--ink-30)',
                      }}
                    >
                      v{r.version_after}
                    </span>
                  )}
                </div>
                <time
                  dateTime={r.changed_at}
                  title={abs}
                  style={{ fontSize: 12, color: 'var(--ink-30)' }}
                >
                  {relativeTime(r.changed_at)}
                </time>
              </div>

              {detail && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    color: 'var(--ink-50)',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}
                >
                  {detail}
                </div>
              )}

              {(r.note || r.actor_kind) && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-30)' }}>
                  {r.actor_kind && <span>{r.actor_kind}</span>}
                  {r.note && (
                    <span>
                      {r.actor_kind ? ' · ' : ''}
                      Note: {r.note}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {revisions.length > COLLAPSE_AT && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            marginTop: 10,
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: 'var(--sage)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Show {revisions.length - COLLAPSE_AT} more
        </button>
      )}
    </section>
  )
}

const sectionTitle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 12,
}

const emptyBox: CSSProperties = {
  padding: 24,
  borderRadius: 12,
  border: '1px solid var(--ink-10)',
  background: 'var(--white)',
  fontSize: 14,
  color: 'var(--ink-30)',
  textAlign: 'center',
}
