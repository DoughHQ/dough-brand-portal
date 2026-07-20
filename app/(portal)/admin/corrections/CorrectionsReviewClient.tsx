'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import {
  approveBlockedReason,
  canApproveAsIs,
  PHOTO_ONLY_TYPES,
  type CorrectionReviewRow,
} from '@/lib/corrections.shared'
import {
  extractCorrectionAction,
  reviewCorrectionAction,
} from './actions'
import OverrideEditors from './OverrideEditors'

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

const REJECT_CHIPS = [
  'Wrong product',
  'Unreadable photo',
  'Spam / duplicate',
  'Not enough evidence',
  'Out of scope',
] as const

const SYSTEM_NOTE_PREFIX = '[OCR extraction failed'

function formatConfidence(raw: number | string | null): string | null {
  const n = Number(raw ?? 0)
  if (!Number.isFinite(n) || n <= 0) return null
  if (n <= 1) return `${Math.round(n * 100)}%`
  return `${Math.round(n)}%`
}

function displayUserNotes(notes: string | null): { text: string; isFossil: boolean } | null {
  if (!notes || notes.trim() === '') return null
  if (notes.trim().startsWith(SYSTEM_NOTE_PREFIX)) {
    return {
      text: 'Earlier automated extraction failed. Use the evidence photo.',
      isFossil: true,
    }
  }
  return { text: notes, isFossil: false }
}

function getOriginal(row: CorrectionReviewRow): { label: string; path?: string | null } {
  const ct = (row.correction_type ?? '').toLowerCase()
  if (ct === 'category') {
    return {
      label: row.current_category ?? 'Not recorded',
      path: row.current_category_path,
    }
  }
  const cv = row.current_value
  if (ct === 'brand') {
    const brand = (cv?.brand_name as string | undefined) ?? row.brand_name
    return { label: brand?.trim() ? brand : 'Not recorded' }
  }
  if (!cv) return { label: 'Not recorded' }
  if (ct === 'name') return { label: String(cv.product_name_display ?? cv.name ?? '—') }
  if (ct === 'ingredients') {
    const t = String(cv.ingredients_text_raw ?? '')
    return { label: t.length > 280 ? `${t.slice(0, 280)}…` : t || '—' }
  }
  if (ct === 'nutrition_facts') {
    const parts: string[] = []
    if (cv.calories != null) parts.push(`${cv.calories} cal`)
    if (cv.sodium_mg != null) parts.push(`${cv.sodium_mg}mg Na`)
    if (cv.protein_g != null) parts.push(`${cv.protein_g}g protein`)
    if (cv.serving_size_value != null) {
      parts.push(`serving ${cv.serving_size_value}${cv.serving_size_uom ?? ''}`)
    }
    return { label: parts.join(' · ') || 'See details' }
  }
  if (ct === 'product_image') {
    return { label: row.product_image_url ? 'Current product photo' : 'No current image' }
  }
  const joined = Object.values(cv).filter(Boolean).join(' · ').slice(0, 160)
  return { label: joined || '—' }
}

function summarizeExtracted(row: CorrectionReviewRow): string | null {
  const ev = row.extracted_value
  if (!ev) return null
  const ct = (row.correction_type ?? '').toLowerCase()
  if (ct === 'ingredients') {
    const t = String(ev.ingredients_text_raw ?? ev.ingredients_raw ?? '')
    return t ? (t.length > 220 ? `${t.slice(0, 220)}…` : t) : 'Extracted (empty ingredients)'
  }
  if (ct === 'nutrition_facts') {
    const parts: string[] = []
    if (ev.basis_type) parts.push(String(ev.basis_type).replace(/_/g, ' '))
    if (ev.calories != null) parts.push(`${ev.calories} cal`)
    if (ev.protein_g != null) parts.push(`${ev.protein_g}g protein`)
    if (ev.serving_size_value != null) {
      parts.push(`${ev.serving_size_value}${ev.serving_size_uom ?? ''}`)
    }
    return parts.join(' · ') || 'Extraction ready — open Override to confirm'
  }
  return 'Extraction ready'
}

function getSuggestion(row: CorrectionReviewRow): {
  label: string
  path?: string | null
  photoOnly: boolean
  needsOverride?: boolean
} {
  const ct = (row.correction_type ?? '').toLowerCase()
  const photoOnly = PHOTO_ONLY_TYPES.has(ct)

  if (photoOnly) {
    const extracted = summarizeExtracted(row)
    if (extracted) {
      return { label: `Extraction draft: ${extracted}`, photoOnly: true, needsOverride: true }
    }
    if (row.extraction_error) {
      return { label: row.extraction_error, photoOnly: true, needsOverride: true }
    }
    return {
      label: row.evidence_image_url
        ? 'Photo only — extract from photo, then confirm via Override'
        : 'No structured proposal and no evidence photo',
      photoOnly: true,
      needsOverride: true,
    }
  }

  const val = row.claude_corrected_value ?? row.proposed_value
  const reviewReason =
    (val as { review_reason?: string } | null)?.review_reason ??
    (row.proposed_value as { review_reason?: string } | null)?.review_reason

  if (ct === 'category') {
    if (row.proposed_category_label) {
      return {
        label: row.proposed_category_label,
        path: row.proposed_category_path,
        photoOnly: false,
      }
    }
    const nodeName = (val as { node_name?: string } | null)?.node_name
    if (nodeName) return { label: nodeName, photoOnly: false }
    if (row.proposed_taxonomy_node_id) {
      return { label: `Node ${row.proposed_taxonomy_node_id}`, photoOnly: false }
    }
    if (row.other_category_description) {
      return {
        label: `Suggested new category: "${row.other_category_description}"`,
        photoOnly: false,
        needsOverride: true,
      }
    }
    if (reviewReason === 'no_match_auto_classify') {
      return {
        label: 'No proposed category — classifier could not match. Assign one via Override.',
        photoOnly: false,
        needsOverride: true,
      }
    }
    if (reviewReason === 'low_confidence_auto_classify') {
      return {
        label: 'Low-confidence classification — confirm or change via Override.',
        photoOnly: false,
        needsOverride: true,
      }
    }
    return {
      label: 'No proposed category to apply — assign one via Override.',
      photoOnly: false,
      needsOverride: true,
    }
  }

  if (!val) {
    return {
      label: 'No proposed value — enter one via Override, or reject.',
      photoOnly: false,
      needsOverride: true,
    }
  }

  if (reviewReason === 'low_confidence_auto_classify') {
    return {
      label: 'Needs human category assignment',
      photoOnly: false,
      needsOverride: true,
    }
  }
  if (ct === 'name') return { label: String((val as { name?: string }).name ?? '—'), photoOnly: false }
  if (ct === 'brand') {
    return {
      label: String((val as { brand_name?: string; brand?: string }).brand_name
        ?? (val as { brand?: string }).brand
        ?? '—'),
      photoOnly: false,
    }
  }
  if (ct === 'price') {
    const amt = row.proposed_price_amount ?? (val as { amount?: unknown }).amount
    const store = row.proposed_price_store ?? (val as { store?: string }).store
    const unit = row.proposed_price_unit ?? (val as { unit?: string }).unit
    return { label: [amt, store, unit].filter(Boolean).join(' · ') || '—', photoOnly: false }
  }
  if (ct === 'product_image') {
    return { label: 'Replace product image with evidence photo', photoOnly: false }
  }
  const vals = Object.values(val).filter((v) => v != null && v !== '')
  return { label: String(vals[0] ?? '—').slice(0, 160), photoOnly: false }
}

function fieldVerb(ct: string): string {
  switch (ct) {
    case 'brand':
      return 'Change brand'
    case 'name':
      return 'Change product name'
    case 'category':
      return 'Change category'
    case 'price':
      return 'Change price'
    case 'product_image':
      return 'Replace product image'
    case 'nutrition_facts':
      return 'Correct nutrition facts'
    case 'ingredients':
      return 'Correct ingredients'
    case 'allergens':
      return 'Correct allergens'
    default:
      return 'Review correction'
  }
}

function shortLabel(text: string, max = 72): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function decisionSentence(
  ct: string,
  fieldLabel: string,
  original: { label: string },
  suggestion: { label: string; needsOverride?: boolean; photoOnly: boolean },
  approveOk: boolean
): { lead: string; from?: string; to?: string } {
  if (!approveOk || suggestion.needsOverride || suggestion.photoOnly) {
    if (ct === 'category') {
      return {
        lead: 'Assign a category',
        from: original.label !== 'Not recorded' ? original.label : undefined,
      }
    }
    if (PHOTO_ONLY_TYPES.has(ct)) {
      return { lead: `${fieldVerb(ct)} from the evidence photo` }
    }
    return { lead: `${fieldVerb(ct)} — needs a value via Override` }
  }
  return {
    lead: fieldVerb(ct),
    from: original.label,
    to: suggestion.label,
  }
}

function whyLine(row: CorrectionReviewRow, opts: {
  hasEvidence: boolean
  photoOnly: boolean
  notes: { text: string; isFossil: boolean } | null
  needsOverride: boolean
}): string {
  const ct = (row.correction_type ?? '').toLowerCase()
  const reviewReason =
    (row.proposed_value as { review_reason?: string } | null)?.review_reason ??
    (row.claude_corrected_value as { review_reason?: string } | null)?.review_reason

  if (reviewReason === 'no_match_auto_classify') {
    return 'Why: classifier could not match this product to a category.'
  }
  if (reviewReason === 'low_confidence_auto_classify') {
    return 'Why: classifier assigned a category with low confidence — confirm or change it.'
  }
  if (opts.notes && !opts.notes.isFossil) {
    return `Why: submitter note — “${shortLabel(opts.notes.text, 120)}”`
  }
  if (opts.photoOnly && opts.hasEvidence) {
    return 'Why: a label photo was submitted; extract values, then confirm via Override.'
  }
  if (opts.hasEvidence) {
    if (ct === 'brand') return 'Why: label photo submitted as evidence for the brand mark.'
    if (ct === 'name') return 'Why: label photo submitted as evidence for the product name.'
    if (ct === 'category') return 'Why: photo or note submitted to support a category change.'
    if (ct === 'product_image') return 'Why: a new product photo was submitted to replace the live image.'
    return 'Why: evidence photo was submitted with this change.'
  }
  if (opts.needsOverride) {
    return 'Why: this item is flagged for a human decision — there is no value to approve as-is.'
  }
  return 'Why: a structured change was proposed and is waiting for review.'
}

function evidenceLookFor(ct: string, proposedLabel: string, approveOk: boolean): string {
  if (ct === 'brand') {
    return approveOk
      ? `Look for the brand mark on the package — does it support “${shortLabel(proposedLabel, 40)}”?`
      : 'Look for the brand mark on the package.'
  }
  if (ct === 'name') {
    return approveOk
      ? `Look for the product name on the package — does it match “${shortLabel(proposedLabel, 40)}”?`
      : 'Look for the product name on the package.'
  }
  if (ct === 'category') {
    return 'Use the package to judge the right shelf category.'
  }
  if (ct === 'nutrition_facts' || ct === 'ingredients') {
    return 'Read the panel on the package, then extract or type the values.'
  }
  if (ct === 'product_image') {
    return 'Confirm this photo should become the live product image.'
  }
  return 'Use this photo as evidence for the proposed change.'
}

function approveButtonLabel(ct: string, proposedLabel: string): string {
  const short = shortLabel(proposedLabel, 36)
  switch (ct) {
    case 'brand':
      return `Approve brand → ${short}`
    case 'name':
      return `Approve name → ${short}`
    case 'category':
      return `Approve category → ${short}`
    case 'price':
      return `Approve price → ${short}`
    case 'product_image':
      return 'Approve new product image'
    default:
      return `Approve ${FIELD_LABELS[ct]?.toLowerCase() ?? 'change'} → ${short}`
  }
}

interface Props {
  initialRows: CorrectionReviewRow[]
}

export default function CorrectionsReviewClient({ initialRows }: Props) {
  const [rows, setRows] = useState(initialRows)
  const [focusIdx, setFocusIdx] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedImg, setExpandedImg] = useState<string | null>(null)
  const [rejectChipById, setRejectChipById] = useState<Record<string, string>>({})
  const [overrideOpenId, setOverrideOpenId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const focused = rows[focusIdx] ?? null

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const focusId = params.get('focus')
    const productId = params.get('product')
    let idx = -1
    if (focusId) {
      idx = initialRows.findIndex((r) => r.id === focusId)
    } else if (productId) {
      idx = initialRows.findIndex((r) => String(r.product_id) === productId)
    }
    if (idx < 0) return
    setFocusIdx(idx)
    const id = initialRows[idx]?.id
    if (!id) return
    window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-correction-id="${id}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [initialRows])

  useEffect(() => {
    if (focusIdx >= rows.length) setFocusIdx(Math.max(0, rows.length - 1))
  }, [rows.length, focusIdx])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 4000)
    return () => window.clearTimeout(t)
  }, [flash])

  const removeRow = useCallback((submissionId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== submissionId))
    setRejectChipById((prev) => {
      const next = { ...prev }
      delete next[submissionId]
      return next
    })
    setOverrideOpenId((id) => (id === submissionId ? null : id))
  }, [])

  const handleDecision = useCallback(
    async (
      submissionId: string,
      decision: 'approved' | 'rejected' | 'overridden',
      opts?: {
        notes?: string | null
        correctedValue?: Record<string, unknown> | null
        skuVariantId?: number | null
      }
    ) => {
      const row = rows.find((r) => r.id === submissionId)
      if (!row) return

      if (decision === 'approved' && !canApproveAsIs(row)) {
        setError(
          'Cannot apply an empty value. Extract from the photo or enter values to override — or reject.'
        )
        return
      }
      if (decision === 'rejected' && (!opts?.notes || opts.notes.trim() === '')) {
        setError('Pick a reject reason first.')
        return
      }

      setBusyId(submissionId)
      setError(null)
      const result = await reviewCorrectionAction(submissionId, decision, opts)
      setBusyId(null)
      if (!result.ok) {
        setError(result.error ?? 'Action failed')
        return
      }

      removeRow(submissionId)
      setFlash(
        decision === 'approved'
          ? 'Approved and applied.'
          : decision === 'overridden'
            ? 'Override applied.'
            : 'Rejected.'
      )
    },
    [removeRow, rows]
  )

  const handleExtract = useCallback(
    async (submissionId: string) => {
      setBusyId(submissionId)
      setError(null)
      const result = await extractCorrectionAction(submissionId)
      setBusyId(null)
      if (!result.ok) {
        setError(result.error ?? 'Extraction failed')
        setRows((prev) =>
          prev.map((r) =>
            r.id === submissionId
              ? { ...r, extraction_error: result.error ?? 'Extraction failed', extracted_value: null }
              : r
          )
        )
        return
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === submissionId
            ? {
                ...r,
                extracted_value: result.extracted_value ?? null,
                extracted_at: new Date().toISOString(),
                extraction_error: null,
              }
            : r
        )
      )
      setOverrideOpenId(submissionId)
      setFlash('Extraction ready — review the draft and confirm Override.')
    },
    []
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (busyId) return
      if (!focused) return

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIdx((i) => Math.min(i + 1, Math.max(0, rows.length - 1)))
        return
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        if (canApproveAsIs(focused)) void handleDecision(focused.id, 'approved')
        else {
          setError(approveBlockedReason(focused) ?? 'Approve unavailable — press O to override.')
          setOverrideOpenId(focused.id)
        }
        return
      }
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        setOverrideOpenId(focused.id)
        setFocusIdx(rows.findIndex((r) => r.id === focused.id))
        return
      }
      if (e.key === 'e' || e.key === 'E') {
        const ct = (focused.correction_type ?? '').toLowerCase()
        if (PHOTO_ONLY_TYPES.has(ct) && focused.evidence_image_url) {
          e.preventDefault()
          void handleExtract(focused.id)
        }
        return
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        const chip = rejectChipById[focused.id]
        if (!chip) {
          setError('Pick a reject reason chip, then press R again.')
          return
        }
        void handleDecision(focused.id, 'rejected', { notes: chip })
        return
      }
      if (e.key === 'Escape') {
        setExpandedImg(null)
        setOverrideOpenId(null)
        setError(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busyId, focused, handleDecision, handleExtract, rejectChipById, rows])

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1100, margin: '0 auto', padding: '36px 32px 96px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Admin
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', marginBottom: 8 }}>
          Correction review
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, maxWidth: 640 }}>
          Evidence first. Approve structured proposals as-is, or Override with typed values.
          Nutrition and ingredients are photo-only — Extract, confirm via Override, or Reject.
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 10 }}>
          Keyboard: <kbd style={kbdStyle}>J</kbd>/<kbd style={kbdStyle}>K</kbd> move ·{' '}
          <kbd style={kbdStyle}>A</kbd> approve · <kbd style={kbdStyle}>O</kbd> override ·{' '}
          <kbd style={kbdStyle}>E</kbd> extract · <kbd style={kbdStyle}>R</kbd> reject
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

      {flash && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 16,
          borderRadius: 'var(--r-sm)',
          background: 'var(--sage-pale, #eef5f0)',
          border: '1px solid rgba(45,106,79,0.2)',
          fontSize: 13,
          color: 'var(--ink)',
        }}>
          {flash}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {rows.map((row, idx) => {
            const ct = (row.correction_type ?? 'other').toLowerCase()
            const conf = formatConfidence(row.claude_confidence)
            const busy = busyId === row.id
            const isFocused = idx === focusIdx
            const approveOk = canApproveAsIs(row)
            const blockedReason = approveBlockedReason(row)
            const original = getOriginal(row)
            const suggestion = getSuggestion(row)
            const notes = displayUserNotes(row.user_notes)
            const hasEvidence = Boolean(row.evidence_image_url)
            const showProductImg = Boolean(row.product_image_url) && (
              ct === 'product_image' || hasEvidence
            )
            const photoOnly = PHOTO_ONLY_TYPES.has(ct)
            const overrideOpen = overrideOpenId === row.id
            const fieldLabel = FIELD_LABELS[ct] ?? row.correction_type ?? 'Correction'
            const needsOverridePrimary = !approveOk
            const decision = decisionSentence(ct, fieldLabel, original, suggestion, approveOk)
            const why = whyLine(row, {
              hasEvidence,
              photoOnly,
              notes,
              needsOverride: Boolean(suggestion.needsOverride) || needsOverridePrimary,
            })
            const lookFor = hasEvidence
              ? evidenceLookFor(ct, suggestion.label, approveOk)
              : null

            return (
              <div
                key={row.id}
                data-correction-id={row.id}
                onClick={() => setFocusIdx(idx)}
                style={{
                  background: 'var(--white)',
                  border: isFocused ? '2px solid var(--sage)' : '1px solid var(--ink-10)',
                  borderRadius: 'var(--r-md)',
                  overflow: 'hidden',
                  boxShadow: isFocused ? '0 0 0 3px rgba(45,106,79,0.12)' : 'none',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--ink-10)',
                  background: isFocused ? 'rgba(45,106,79,0.04)' : 'transparent',
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--sage)',
                      marginBottom: 8,
                    }}>
                      {fieldLabel}
                      {photoOnly ? (
                        <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--amber)' }}>
                          · photo-only
                        </span>
                      ) : null}
                      {needsOverridePrimary && !photoOnly ? (
                        <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--amber)' }}>
                          · needs assignment
                        </span>
                      ) : null}
                    </div>

                    <div style={{
                      fontFamily: 'var(--font-serif, var(--font-display))',
                      fontSize: 22,
                      fontWeight: 400,
                      lineHeight: 1.25,
                      color: 'var(--ink)',
                      marginBottom: 8,
                    }}>
                      {decision.lead}
                      {decision.from != null && decision.to != null && (
                        <>
                          {' '}
                          <span style={{ color: 'var(--ink-50)', fontSize: 18 }}>from</span>{' '}
                          <span style={{ textDecoration: 'line-through', color: 'var(--ink-50)' }}>
                            {shortLabel(decision.from, 48)}
                          </span>
                          {' '}
                          <span style={{ color: 'var(--ink-50)', fontSize: 18 }}>→</span>{' '}
                          <span style={{ color: 'var(--sage)', fontWeight: 500 }}>
                            {shortLabel(decision.to, 48)}
                          </span>
                        </>
                      )}
                      {decision.from != null && decision.to == null && (
                        <>
                          {' '}
                          <span style={{ color: 'var(--ink-50)', fontSize: 18 }}>· currently</span>{' '}
                          <span style={{ color: 'var(--ink-50)' }}>{shortLabel(decision.from, 48)}</span>
                        </>
                      )}
                    </div>

                    <div style={{
                      fontSize: 14,
                      lineHeight: 1.45,
                      color: 'var(--ink)',
                      marginBottom: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(45,106,79,0.06)',
                      border: '1px solid rgba(45,106,79,0.12)',
                    }}>
                      {why}
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
                      <span style={{ fontWeight: 500, color: 'var(--ink)' }}>
                        {row.product_name_display ?? `Product ${row.product_id}`}
                      </span>
                      {row.brand_name ? ` · ${row.brand_name}` : ''}
                      {row.current_category ? ` · ${row.current_category}` : ''}
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
                    {conf && row.claude_decision && (
                      <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>
                        Prior AI (retired): {row.claude_decision} · {conf}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
                      {new Date(row.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                {(hasEvidence || showProductImg) && (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: showProductImg && hasEvidence ? '1fr 1fr' : '1fr',
                      gap: 0,
                      background: 'var(--surface-1, #f7f6f3)',
                    }}>
                      {hasEvidence && (
                        <button
                          type="button"
                          onClick={() => setExpandedImg(row.evidence_image_url!)}
                          style={{
                            border: 'none',
                            padding: 0,
                            cursor: 'zoom-in',
                            background: 'transparent',
                            minHeight: 280,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          <img
                            src={row.evidence_image_url!}
                            alt="Evidence"
                            style={{
                              width: '100%',
                              maxHeight: 420,
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                          <span style={badgeStyle}>Evidence</span>
                        </button>
                      )}
                      {showProductImg && (
                        <div style={{
                          minHeight: 280,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          borderLeft: hasEvidence ? '1px solid var(--ink-10)' : 'none',
                        }}>
                          <img
                            src={row.product_image_url!}
                            alt="Current product"
                            style={{
                              width: '100%',
                              maxHeight: 420,
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                          <span style={badgeStyle}>Live product</span>
                        </div>
                      )}
                    </div>
                    {lookFor && (
                      <div style={{
                        padding: '10px 20px',
                        borderBottom: '1px solid var(--ink-10)',
                        background: 'var(--cream, #faf8f3)',
                        fontSize: 13,
                        color: 'var(--ink)',
                        lineHeight: 1.45,
                      }}>
                        {lookFor}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <div style={{ padding: '18px 20px', borderRight: '1px solid var(--ink-10)' }}>
                    <div style={sectionLabel}>Current {fieldLabel}</div>
                    <div style={{ fontSize: 16, color: 'var(--ink-50)', lineHeight: 1.45, fontWeight: 500 }}>
                      {original.label}
                    </div>
                    {original.path && (
                      <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 6, lineHeight: 1.4 }}>
                        {original.path.replace(/>/g, ' › ')}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={sectionLabel}>Proposed {fieldLabel}</div>
                    <div style={{
                      fontSize: 16,
                      color: suggestion.photoOnly || suggestion.needsOverride ? 'var(--amber)' : 'var(--sage)',
                      lineHeight: 1.45,
                      fontWeight: 600,
                    }}>
                      {suggestion.label}
                    </div>
                    {suggestion.path && (
                      <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 6, lineHeight: 1.4 }}>
                        {suggestion.path.replace(/>/g, ' › ')}
                      </div>
                    )}
                    {blockedReason && (
                      <div style={{
                        fontSize: 13,
                        color: 'var(--ink)',
                        marginTop: 12,
                        lineHeight: 1.45,
                        padding: '10px 12px',
                        background: 'rgba(192,120,24,0.08)',
                        borderRadius: 8,
                        border: '1px solid rgba(192,120,24,0.2)',
                      }}>
                        {blockedReason}
                      </div>
                    )}
                    {notes && (
                      <div style={{
                        fontSize: 13,
                        color: notes.isFossil ? 'var(--ink-30)' : 'var(--ink)',
                        marginTop: 12,
                        lineHeight: 1.45,
                        padding: '10px 12px',
                        background: notes.isFossil ? 'transparent' : 'rgba(45,106,79,0.06)',
                        borderRadius: 8,
                        fontStyle: notes.isFossil ? 'italic' : 'normal',
                      }}>
                        {notes.isFossil ? notes.text : (
                          <>
                            <span style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-30)', display: 'block', marginBottom: 4 }}>
                              User note
                            </span>
                            {notes.text}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {photoOnly && hasEvidence && (
                  <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid var(--ink-10)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleExtract(row.id)
                      }}
                      style={{
                        padding: '9px 14px',
                        borderRadius: 'var(--r-sm)',
                        border: '1px solid var(--sage)',
                        background: 'rgba(45,106,79,0.08)',
                        color: 'var(--sage)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: busy ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {busy ? 'Extracting…' : 'Extract from photo'}
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>
                      Writes to extracted_value only — you must confirm via Override
                    </span>
                  </div>
                )}

                <div style={{
                  padding: '10px 20px',
                  borderTop: '1px solid var(--ink-10)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-30)', marginRight: 4 }}>Reject reason:</span>
                  {REJECT_CHIPS.map((chip) => {
                    const selected = rejectChipById[row.id] === chip
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFocusIdx(idx)
                          setRejectChipById((prev) => ({ ...prev, [row.id]: chip }))
                          setError(null)
                        }}
                        style={{
                          fontSize: 12,
                          padding: '5px 10px',
                          borderRadius: 999,
                          border: selected ? '1px solid #DC2626' : '1px solid var(--ink-10)',
                          background: selected ? 'rgba(220,38,38,0.08)' : 'transparent',
                          color: selected ? '#B91C1C' : 'var(--ink-50)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {chip}
                      </button>
                    )
                  })}
                </div>

                {overrideOpen && (
                  <OverrideEditors
                    row={row}
                    busy={busy}
                    onCancel={() => setOverrideOpenId(null)}
                    onSubmit={(value, skuVariantId) => {
                      void handleDecision(row.id, 'overridden', {
                        correctedValue: value,
                        skuVariantId,
                      })
                    }}
                  />
                )}

                {!overrideOpen && (
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    padding: '12px 20px',
                    borderTop: '1px solid var(--ink-10)',
                  }}>
                    {needsOverridePrimary ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOverrideOpenId(row.id)
                          }}
                          style={btnPrimary(busy)}
                        >
                          {ct === 'category' ? 'Assign category (Override)' : 'Override'}
                        </button>
                        <button
                          type="button"
                          disabled
                          title={blockedReason ?? 'Approve unavailable'}
                          style={btnSecondary(true)}
                        >
                          Approve unavailable
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busy || !approveOk}
                          title="Approve proposed value as-is (A)"
                          onClick={() => void handleDecision(row.id, 'approved')}
                          style={btnPrimary(busy)}
                        >
                          {busy ? 'Working…' : approveButtonLabel(ct, suggestion.label)}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOverrideOpenId(row.id)
                          }}
                          style={btnSecondary(busy)}
                        >
                          Override
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={busy || !rejectChipById[row.id]}
                      onClick={() => {
                        const chip = rejectChipById[row.id]
                        if (!chip) {
                          setError('Pick a reject reason chip first.')
                          return
                        }
                        void handleDecision(row.id, 'rejected', { notes: chip })
                      }}
                      style={{
                        flex: 1,
                        padding: '11px 16px',
                        borderRadius: 'var(--r-sm)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        background: 'transparent',
                        color: '#DC2626',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: busy || !rejectChipById[row.id] ? 'not-allowed' : 'pointer',
                        opacity: !rejectChipById[row.id] ? 0.55 : 1,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
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
            background: 'rgba(0,0,0,0.9)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            cursor: 'zoom-out',
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

const kbdStyle: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
  padding: '1px 5px',
  borderRadius: 4,
  border: '1px solid var(--ink-10)',
  background: 'var(--surface-1, #f7f6f3)',
}

const badgeStyle: CSSProperties = {
  position: 'absolute',
  left: 12,
  top: 12,
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'rgba(0,0,0,0.65)',
  color: '#fff',
  padding: '4px 8px',
  borderRadius: 4,
}

const sectionLabel: CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 8,
}

function btnPrimary(disabled: boolean): CSSProperties {
  return {
    flex: 1,
    padding: '11px 16px',
    borderRadius: 'var(--r-sm)',
    border: 'none',
    background: disabled ? 'var(--ink-10)' : 'var(--sage)',
    color: disabled ? 'var(--ink-30)' : 'white',
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-sans)',
  }
}

function btnSecondary(disabled: boolean): CSSProperties {
  return {
    flex: 1,
    padding: '11px 16px',
    borderRadius: 'var(--r-sm)',
    border: '1px solid var(--sage)',
    background: 'transparent',
    color: 'var(--sage)',
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-sans)',
  }
}
