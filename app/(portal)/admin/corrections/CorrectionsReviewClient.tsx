'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CorrectionReviewRow } from '@/lib/corrections'
import { reviewCorrectionAction } from './actions'

const FIELD_LABELS: Record<string, string> = {
  name: 'Product Name',
  brand: 'Brand',
  category: 'Category',
  ingredients: 'Ingredients',
  nutrition_facts: 'Nutrition Facts',
  allergens: 'Allergens',
  price: 'Price',
  product_image: 'Product Image',
  other: 'Other',
}

function formatConfidence(raw: number | string | null): string | null {
  const n = Number(raw ?? 0)
  if (!Number.isFinite(n) || n <= 0) return null
  if (n <= 1) return `${Math.round(n * 100)}%`
  return `${Math.round(n)}%`
}

function getOriginal(row: CorrectionReviewRow): string {
  const cv = row.current_value
  if (row.current_category) return row.current_category
  if (!cv) return 'Not recorded'
  const ct = (row.correction_type ?? '').toLowerCase()
  if (ct === 'name') return String(cv.product_name_display ?? cv.name ?? '')
  if (ct === 'brand') return String(cv.brand_name ?? '')
  if (ct === 'category') return String(cv.category ?? cv.category_name ?? cv.node_name_display ?? '')
  if (ct === 'ingredients') {
    const t = String(cv.ingredients_text_raw ?? '')
    return t.length > 200 ? `${t.slice(0, 200)}…` : t
  }
  if (ct === 'nutrition_facts') {
    const parts: string[] = []
    if (cv.calories != null) parts.push(`${cv.calories} cal`)
    if (cv.sodium_mg != null) parts.push(`${cv.sodium_mg}mg Na`)
    if (cv.protein_g != null) parts.push(`${cv.protein_g}g protein`)
    return parts.join(' · ') || 'See details'
  }
  return Object.values(cv).filter(Boolean).join(' · ').slice(0, 120)
}

function getSuggestion(row: CorrectionReviewRow): string {
  const val = row.claude_corrected_value ?? row.proposed_value
  if (!val) return '—'
  const ct = (row.correction_type ?? '').toLowerCase()
  if (val.review_reason === 'low_confidence_auto_classify') {
    return 'Needs human category assignment'
  }
  if (ct === 'name') return String((val as { name?: string }).name ?? '')
  if (ct === 'brand') return String((val as { brand_name?: string }).brand_name ?? '')
  if (ct === 'category') {
    const nodeName = (val as { node_name?: string }).node_name
    if (nodeName) return nodeName
    if (row.proposed_taxonomy_node_id) return `Node ${row.proposed_taxonomy_node_id}`
    const nodeId = (val as { taxonomy_node_id?: number }).taxonomy_node_id
    return nodeId ? `Node ${nodeId}` : '—'
  }
  if (ct === 'ingredients') {
    const t = String((val as { ingredients_text_raw?: string }).ingredients_text_raw ?? '')
    return t.length > 200 ? `${t.slice(0, 200)}…` : t
  }
  if (ct === 'price') {
    const amt = row.proposed_price_amount ?? (val as { amount?: unknown }).amount
    const store = row.proposed_price_store ?? (val as { store?: string }).store
    const unit = row.proposed_price_unit ?? (val as { unit?: string }).unit
    return [amt, store, unit].filter(Boolean).join(' · ') || '—'
  }
  const vals = Object.values(val).filter((v) => v != null && v !== '')
  return String(vals[0] ?? '—').slice(0, 120)
}

interface Props {
  initialRows: CorrectionReviewRow[]
}

export default function CorrectionsReviewClient({ initialRows }: Props) {
  const [rows, setRows] = useState(initialRows)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedImg, setExpandedImg] = useState<string | null>(null)

  async function handleAction(submissionId: string, action: 'approve' | 'reject') {
    setBusyId(submissionId)
    setError(null)
    const result = await reviewCorrectionAction(submissionId, action)
    setBusyId(null)
    if (!result.ok) {
      setError(result.error ?? 'Action failed')
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== submissionId))
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 960, margin: '0 auto', padding: '36px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Admin
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', marginBottom: 8 }}>
          Correction review
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          User-reported misinformation and low-confidence auto-classifications awaiting human review.
        </p>
      </div>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 'var(--r-sm)',
        background: 'var(--amber-pale)',
        border: '1px solid rgba(192,120,24,0.2)',
        marginBottom: 24,
        fontSize: 13,
        color: 'var(--amber)',
        fontWeight: 500,
      }}>
        {rows.length} pending
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 16,
          borderRadius: 'var(--r-sm)',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          fontSize: 13,
          color: '#B91C1C',
        }}>
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-md)',
          padding: '48px 24px',
          textAlign: 'center',
          fontSize: 14,
          color: 'var(--ink-30)',
        }}>
          No items pending review.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rows.map((row) => {
            const ct = (row.correction_type ?? 'other').toLowerCase()
            const conf = formatConfidence(row.claude_confidence)
            const busy = busyId === row.id

            return (
              <div
                key={row.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--ink-10)',
                  borderRadius: 'var(--r-md)',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--ink-10)',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--sage)', marginBottom: 4 }}>
                      {FIELD_LABELS[ct] ?? row.correction_type ?? 'Correction'}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
                      {row.product_name_display ?? `Product ${row.product_id}`}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 2 }}>
                      {row.brand_name ?? 'Unknown brand'}
                      {' · '}
                      <Link
                        href={`/products/${row.product_id}`}
                        style={{ color: 'var(--sage)', textDecoration: 'none' }}
                      >
                        View product →
                      </Link>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {conf && (
                      <div style={{ fontSize: 12, color: 'var(--ink-30)', marginBottom: 4 }}>
                        AI confidence {conf}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
                      {new Date(row.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: row.evidence_image_url ? '1fr 1fr 88px' : '1fr 1fr', gap: 0 }}>
                  <div style={{ padding: '16px 20px', borderRight: '1px solid var(--ink-10)' }}>
                    <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-30)', marginBottom: 6 }}>
                      Current
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
                      {getOriginal(row)}
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', borderRight: row.evidence_image_url ? '1px solid var(--ink-10)' : 'none' }}>
                    <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-30)', marginBottom: 6 }}>
                      Proposed
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, fontWeight: 500 }}>
                      {getSuggestion(row)}
                    </div>
                    {row.claude_reasoning && (
                      <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 8, lineHeight: 1.45, fontStyle: 'italic' }}>
                        {row.claude_reasoning}
                      </div>
                    )}
                    {row.user_notes && (
                      <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 8, lineHeight: 1.45 }}>
                        User note: {row.user_notes}
                      </div>
                    )}
                  </div>
                  {row.evidence_image_url && (
                    <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setExpandedImg(row.evidence_image_url!)}
                        style={{
                          border: '1px solid var(--ink-10)',
                          borderRadius: 8,
                          padding: 0,
                          cursor: 'pointer',
                          background: 'var(--surface-1)',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={row.evidence_image_url}
                          alt="Evidence"
                          style={{ width: 64, height: 64, objectFit: 'cover', display: 'block' }}
                        />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  gap: 10,
                  padding: '12px 20px',
                  borderTop: '1px solid var(--ink-10)',
                }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleAction(row.id, 'approve')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 'var(--r-sm)',
                      border: 'none',
                      background: busy ? 'var(--ink-30)' : 'var(--sage)',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: busy ? 'default' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {busy ? 'Working…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleAction(row.id, 'reject')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid rgba(239,68,68,0.35)',
                      background: 'transparent',
                      color: '#DC2626',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: busy ? 'default' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {expandedImg && (
        <div
          role="presentation"
          onClick={() => setExpandedImg(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            cursor: 'pointer',
          }}
        >
          <img
            src={expandedImg}
            alt="Evidence full size"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}
