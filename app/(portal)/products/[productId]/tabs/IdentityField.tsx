'use client'

import {
  button,
  caption,
  fieldEmpty,
  fieldLabel,
  fieldValue,
  inputStyle as masterInput,
  productName as productNameStyle,
} from '@/lib/productMaster/styles'
import { displayProductName, formatJsonValue, relativeAgo } from '@/lib/productMaster/format'
import type { RecentChange } from '@/lib/productMaster/types'
import { ProposalBadge } from './productMasterBits'
import type { CSSProperties } from 'react'

const muted: CSSProperties = { ...caption }
const secondaryBtn: CSSProperties = { ...button }
const inputStyle: CSSProperties = { ...masterInput }

export function IdentityField({
  label,
  field,
  value,
  editing,
  draft,
  canEdit,
  prior,
  pending,
  onStart,
  onDraft,
  onSave,
  onCancel,
  saving,
  large,
  multiline,
  compact,
}: {
  label: string
  field: string
  value: string | null
  editing: boolean
  draft: string
  canEdit: boolean
  prior?: RecentChange
  pending: boolean
  onStart: () => void
  onDraft: (v: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  large?: boolean
  multiline?: boolean
  compact?: boolean
}) {
  if (editing) {
    const editor = (
      <>
        {prior && (
          <div style={{ ...muted, marginBottom: 6 }}>
            Overwriting {formatJsonValue(prior.old_value)} → {formatJsonValue(prior.new_value)} set by{' '}
            {prior.actor_label} {relativeAgo(prior.changed_at)}
          </div>
        )}
        {multiline ? (
          <textarea value={draft} onChange={(e) => onDraft(e.target.value)} rows={4} style={inputStyle} />
        ) : (
          <input value={draft} onChange={(e) => onDraft(e.target.value)} style={inputStyle} autoFocus />
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={onSave} disabled={saving} style={secondaryBtn}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} style={secondaryBtn}>
            Cancel
          </button>
        </div>
      </>
    )
    if (compact) {
      return (
        <div className="pm-id-row">
          <div className="pm-id-label">{label}</div>
          <div className="pm-id-edit">{editor}</div>
        </div>
      )
    }
    return (
      <div>
        <div style={{ ...fieldLabel, marginBottom: 4 }}>{label}</div>
        {editor}
      </div>
    )
  }

  const display = (large ? displayProductName(value) : value) || (canEdit ? 'Add' : '—')
  const isAdd = !value && canEdit

  if (compact) {
    return (
      <div className="pm-id-row">
        <div className="pm-id-label">
          {label}
          {pending && <ProposalBadge types={new Set(['name'])} match="name" />}
        </div>
        <button
          type="button"
          onClick={canEdit ? onStart : undefined}
          disabled={!canEdit}
          className={`pm-id-value${isAdd ? ' pm-id-add' : ''}`}
          title={canEdit ? 'Click to edit' : undefined}
        >
          {display}
        </button>
      </div>
    )
  }

  return (
    <div>
      {!large && (
        <div style={{ ...fieldLabel, marginBottom: 4 }}>
          {label}
          {pending && <ProposalBadge types={new Set(['name'])} match="name" />}
        </div>
      )}
      <button
        type="button"
        onClick={canEdit ? onStart : undefined}
        disabled={!canEdit}
        className={large ? 'pm-product-title' : undefined}
        style={{
          ...(large ? productNameStyle : fieldValue),
          ...(!value && canEdit ? fieldEmpty : {}),
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: canEdit ? 'pointer' : 'default',
          width: '100%',
        }}
        title={canEdit ? 'Click to edit' : undefined}
      >
        {display}
      </button>
    </div>
  )
}
