'use client'

import type { CSSProperties } from 'react'
import type { CompareGroupDetail } from '@/lib/compareGroups.shared'
import {
  groupCode,
  groupName,
  groupStrategy,
  groupVersion,
} from './groupHelpers'

type Props = {
  detail: CompareGroupDetail
  onEditDetails: () => void
  onManageNodes: () => void
}

export default function Header({ detail, onEditDetails, onManageNodes }: Props) {
  const { group } = detail
  const name = groupName(group)
  const code = groupCode(group)
  const strategy = groupStrategy(group)
  const status = typeof group.status === 'string' ? group.status : 'active'
  const version = groupVersion(group)

  return (
    <div
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
            margin: '0 0 8px',
            lineHeight: 1.2,
          }}
        >
          {name}
        </h1>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {code && (
            <span style={{ fontSize: 13, color: 'var(--ink-30)' }}>{code}</span>
          )}
          <span style={statusPill(status)}>{status}</span>
          {strategy && <span style={strategyBadge}>{strategy}</span>}
          {version != null && (
            <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>v{version}</span>
          )}
        </div>
        {(group.consumer_question as string | null)?.trim() && (
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 14,
              color: 'var(--ink-50)',
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            {(group.consumer_question as string).trim()}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button type="button" onClick={onEditDetails} style={secondaryBtn}>
          Edit details
        </button>
        <button type="button" onClick={onManageNodes} style={secondaryBtn}>
          Manage nodes
        </button>
      </div>
    </div>
  )
}

function statusPill(status: string): CSSProperties {
  const active = status === 'active'
  return {
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 999,
    background: active ? 'rgba(62,107,74,0.12)' : 'rgba(28,38,32,0.08)',
    color: active ? 'var(--sage)' : 'var(--ink-50)',
    textTransform: 'lowercase',
  }
}

const strategyBadge: CSSProperties = {
  fontSize: 12,
  padding: '2px 8px',
  borderRadius: 6,
  background: 'var(--cream, #FAF8F3)',
  color: 'var(--ink-50)',
}

const secondaryBtn: CSSProperties = {
  padding: '9px 14px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  background: 'var(--white)',
  color: 'var(--ink)',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
}
