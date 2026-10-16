'use client'

import type { CSSProperties } from 'react'
import { button, fieldLabel, inputStyle as masterInput } from '@/lib/productMaster/styles'
import { formatMoney } from '@/lib/productMaster/format'
import type { MasterSku } from '@/lib/productMaster/types'
import { ProposalBadge } from './productMasterBits'

const secondaryBtn: CSSProperties = { ...button }
const inputStyle: CSSProperties = { ...masterInput }

export function SkuMsrpField({
  sku,
  canEdit,
  correctionTypes,
  multiSku,
  editingMsrp,
  msrpDraft,
  onStartMsrp,
  onMsrpDraft,
  onSaveMsrp,
  onCancelMsrp,
  saving,
}: {
  sku: MasterSku
  canEdit: boolean
  correctionTypes: Set<string>
  multiSku: boolean
  editingMsrp: boolean
  msrpDraft: string
  onStartMsrp: () => void
  onMsrpDraft: (v: string) => void
  onSaveMsrp: () => void
  onCancelMsrp: () => void
  saving: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...fieldLabel, marginBottom: 4 }}>
        MSRP
        {!multiSku && <ProposalBadge types={correctionTypes} match="price" />}
      </div>
      {editingMsrp ? (
        <div>
          <input
            value={msrpDraft}
            onChange={(e) => onMsrpDraft(e.target.value)}
            type="number"
            step="0.01"
            style={{ ...inputStyle, maxWidth: 140 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={onSaveMsrp} disabled={saving} style={secondaryBtn}>
              Save
            </button>
            <button type="button" onClick={onCancelMsrp} style={secondaryBtn}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={canEdit ? onStartMsrp : undefined}
          disabled={!canEdit}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 16,
            fontFamily: 'var(--font-serif, var(--font-display))',
            cursor: canEdit ? 'pointer' : 'default',
            color: 'var(--ink)',
          }}
        >
          {formatMoney(sku.msrp)}
        </button>
      )}
    </div>
  )
}
