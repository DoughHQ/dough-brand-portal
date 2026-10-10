'use client'

import { useState, type CSSProperties } from 'react'
import { button, caption } from '@/lib/productMaster/styles'
import { formatJsonValue, relativeAgo } from '@/lib/productMaster/format'
import type { StaleState } from './useProductMasterWrites'

const muted: CSSProperties = { ...caption }
const secondaryBtn: CSSProperties = { ...button }

export function StaleWritePanel({
  stale,
  onKeep,
  onReapply,
  onDismiss,
}: {
  stale: StaleState
  onKeep: () => void
  onReapply: () => void
  onDismiss: () => void
}) {
  const [compare, setCompare] = useState(false)
  const change = stale.change
  return (
    <div
      style={{
        marginBottom: 20,
        padding: 16,
        border: '1px solid rgba(192,120,24,0.35)',
        background: 'var(--amber-pale, #f3e6d0)',
        borderRadius: 8,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>
        This product changed while you were editing.
      </div>
      {change ? (
        <p style={{ ...muted, margin: '0 0 12px', color: 'var(--ink)' }}>
          {change.actor_label} changed <code>{change.field_name}</code> from{' '}
          &ldquo;{formatJsonValue(change.old_value)}&rdquo; to &ldquo;{formatJsonValue(change.new_value)}&rdquo;{' '}
          {relativeAgo(change.changed_at)}.
        </p>
      ) : (
        <p style={{ ...muted, margin: '0 0 12px' }}>Someone else saved. Your edit was not applied.</p>
      )}
      {compare && change && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Theirs</div>
            {formatJsonValue(change.new_value)}
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Yours</div>
            {formatJsonValue(stale.localValue)}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={onKeep} style={secondaryBtn}>
          Keep theirs
        </button>
        <button type="button" onClick={onReapply} style={secondaryBtn}>
          Reapply mine
        </button>
        <button type="button" onClick={() => setCompare((c) => !c)} style={secondaryBtn}>
          Compare
        </button>
        <button type="button" onClick={onDismiss} style={{ ...secondaryBtn, opacity: 0.7 }}>
          Dismiss
        </button>
      </div>
    </div>
  )
}
