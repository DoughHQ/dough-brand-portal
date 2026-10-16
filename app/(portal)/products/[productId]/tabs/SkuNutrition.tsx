'use client'

import type { CSSProperties } from 'react'
import { EvidenceRungChip } from '@/components/productMaster/EvidenceRungChip'
import { SupportLink } from '@/components/productMaster/ComingSoonStub'
import { bodyText, button, caption, fieldLabel, inputStyle as masterInput } from '@/lib/productMaster/styles'
import type { MasterSku } from '@/lib/productMaster/types'
import { ProposalBadge } from './productMasterBits'
import { PRODUCT_NAME } from '@/lib/brand'

const UNMAPPED_NUTRIENT = /^nutrient_\d+$/

const HEADLINE_NUTRIENTS: { key: string; label: string; suffix?: string }[] = [
  { key: 'serving_size', label: 'Serving' },
  { key: 'calories', label: 'Calories' },
  { key: 'total_carbs_g', label: 'Total carbs', suffix: 'g' },
  { key: 'protein_g', label: 'Protein', suffix: 'g' },
  { key: 'total_fat_g', label: 'Total fat', suffix: 'g' },
  { key: 'sodium_mg', label: 'Sodium', suffix: 'mg' },
]

const MORE_MACROS: { key: string; label: string; suffix?: string }[] = [
  { key: 'total_sugars_g', label: 'Total sugars', suffix: 'g' },
  { key: 'added_sugars_g', label: 'Added sugars', suffix: 'g' },
  { key: 'dietary_fiber_g', label: 'Dietary fiber', suffix: 'g' },
  { key: 'saturated_fat_g', label: 'Saturated fat', suffix: 'g' },
  { key: 'trans_fat_g', label: 'Trans fat', suffix: 'g' },
  { key: 'cholesterol_mg', label: 'Cholesterol', suffix: 'mg' },
]

const CORE_MICROS: { key: string; label: string; suffix?: string }[] = [
  { key: 'vitamin_d_mcg', label: 'Vitamin D', suffix: 'mcg' },
  { key: 'calcium_mg', label: 'Calcium', suffix: 'mg' },
  { key: 'iron_mg', label: 'Iron', suffix: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', suffix: 'mg' },
  { key: 'vitamin_a_mcg', label: 'Vitamin A', suffix: 'mcg' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', suffix: 'mg' },
]

const muted: CSSProperties = { ...caption }
const secondaryBtn: CSSProperties = { ...button }
const inputStyle: CSSProperties = { ...masterInput }

export function SkuNutrition({
  sku,
  canEdit,
  correctionTypes,
  multiSku,
  showAll,
  onToggleAll,
  editingNutritionKey,
  nutritionDraft,
  onStartNutrition,
  onNutritionDraft,
  onSaveNutrition,
  onCancelNutrition,
}: {
  sku: MasterSku
  canEdit: boolean
  correctionTypes: Set<string>
  multiSku: boolean
  showAll: boolean
  onToggleAll: () => void
  editingNutritionKey: string | null
  nutritionDraft: string
  onStartNutrition: (key: string, val: string | null) => void
  onNutritionDraft: (v: string) => void
  onSaveNutrition: (key: string) => void
  onCancelNutrition: () => void
}) {
  const n = sku.nutrition

  function nutrientValue(key: string): string | null {
    if (!n) return null
    if (key === 'serving_size') {
      if (n.serving_size_value == null) return null
      return `${n.serving_size_value}${n.serving_size_uom ? ` ${n.serving_size_uom}` : ''}`
    }
    const v = (n as Record<string, unknown>)[key]
    return v == null ? null : String(v)
  }

  const extended = Object.entries(n?.extended_nutrients ?? {}).filter(
    ([k]) => !UNMAPPED_NUTRIENT.test(k)
  )

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...bodyText, fontWeight: 500, marginBottom: 8 }}>
        Nutrition
        {!multiSku && <ProposalBadge types={correctionTypes} match="nutrition" />}
        {n && <EvidenceRungChip rung={n.evidence_rung} />}
      </div>
      {!n ? (
        <p style={muted}>No nutrition on file.</p>
      ) : (
        <>
          {n.locked && (
            <p style={{ ...muted, marginBottom: 8 }}>
              🔒 {PRODUCT_NAME} verified this against the label.{' '}
              <SupportLink subject={`Locked nutrition — SKU ${sku.sku_variant_id}`}>
                Contact us to change it
              </SupportLink>
              .
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              marginBottom: 10,
            }}
          >
            {HEADLINE_NUTRIENTS.map(({ key, label, suffix }) => {
              const editKey = `${sku.sku_variant_id}:${key}`
              const editableKey = key === 'serving_size' ? null : key
              const display = nutrientValue(key)
              if (editingNutritionKey === editKey && editableKey && !n.locked) {
                return (
                  <div key={key}>
                    <div style={{ ...fieldLabel }}>{label}</div>
                    <input
                      value={nutritionDraft}
                      onChange={(e) => onNutritionDraft(e.target.value)}
                      style={inputStyle}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <button
                        type="button"
                        style={{ ...secondaryBtn, padding: '2px 6px', fontSize: 13 }}
                        onClick={() => onSaveNutrition(editableKey)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        style={{ ...secondaryBtn, padding: '2px 6px', fontSize: 13 }}
                        onClick={onCancelNutrition}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              }
              return (
                <div key={key}>
                  <div style={{ ...fieldLabel }}>{label}</div>
                  <button
                    type="button"
                    disabled={!canEdit || n.locked || !editableKey}
                    onClick={() =>
                      editableKey &&
                      onStartNutrition(
                        editableKey,
                        (n as Record<string, unknown>)[editableKey] != null
                          ? String((n as Record<string, unknown>)[editableKey])
                          : ''
                      )
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: 15,
                      cursor: canEdit && !n.locked && editableKey ? 'pointer' : 'default',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {display != null
                      ? key === 'serving_size'
                        ? display
                        : suffix
                          ? `${display} ${suffix}`
                          : display
                      : '—'}
                  </button>
                </div>
              )
            })}
          </div>
          <button type="button" onClick={onToggleAll} style={{ ...secondaryBtn, marginBottom: 8 }}>
            {showAll ? 'Hide nutrients' : 'More nutrients'}
          </button>
          {showAll && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[...MORE_MACROS, ...CORE_MICROS].map(({ key, label, suffix }) => {
                const v = (n as Record<string, unknown>)[key]
                return (
                  <div key={key} style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-50)' }}>{label}</span>
                    <div>
                      {v == null ? '—' : `${v}${suffix ? ` ${suffix}` : ''}`}
                    </div>
                  </div>
                )
              })}
              {extended.map(([k, v]) => (
                <div key={k} style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--ink-50)' }}>{k.replace(/_/g, ' ')}</span>
                  <div>{v == null ? '—' : String(v)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
