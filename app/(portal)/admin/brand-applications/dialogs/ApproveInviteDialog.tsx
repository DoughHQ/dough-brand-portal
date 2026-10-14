'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  formatProductCount,
  type BrandApplication,
  type CatalogCandidate,
} from '@/lib/brandApplications'
import { DialogShell } from './DialogShell'
import { Footer } from './DialogFooter'
import type { ApproveSubmit } from './approveSubmit'
import { inputStyle, labelStyle } from './dialogStyles'

function formatProducts(n: number): string {
  const count = Math.max(0, Math.trunc(n))
  return count === 1 ? '1 product' : `${count.toLocaleString()} products`
}

export function ApproveInviteDialog({
  row,
  busy,
  error,
  candidateOverride,
  onClose,
  onSubmit,
}: {
  row: BrandApplication
  busy: boolean
  error: string | null
  candidateOverride: CatalogCandidate[] | null
  onClose: () => void
  onSubmit: (input: ApproveSubmit) => void
}) {
  const linked = row.selected_brand_id != null
  const candidates = candidateOverride ?? row.catalog_candidates
  const [brandName, setBrandName] = useState(row.brand_name_typed)
  const [notes, setNotes] = useState('')
  const [choice, setChoice] = useState<'new' | number | null>(
    linked ? row.selected_brand_id : candidates.length === 0 ? 'new' : null
  )

  // When the edge returns possible_duplicate candidates, force an explicit pick —
  // do not keep the initial "Create new brand" selection.
  useEffect(() => {
    if (candidateOverride && candidateOverride.length > 0) {
      setChoice(null)
    }
  }, [candidateOverride])

  const canSubmit = useMemo(() => {
    if (row.already_claimed) return false
    if (linked) return true
    if (choice === 'new') {
      const n = brandName.trim()
      return n.length >= 1 && n.length <= 200
    }
    return typeof choice === 'number'
  }, [row.already_claimed, linked, choice, brandName])

  return (
    <DialogShell title="Approve & invite" onClose={onClose} busy={busy}>
      {linked ? (
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, marginBottom: 14 }}>
          Invite <strong style={{ color: 'var(--ink)' }}>{row.contact_email}</strong> to{' '}
          <strong style={{ color: 'var(--ink)' }}>
            {row.selected_brand_name ?? row.brand_name_typed}
          </strong>{' '}
          ({formatProductCount(row)}).
        </p>
      ) : (
        <>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, marginBottom: 14 }}>
            Create or link a brand, then email a 7-day invite to{' '}
            <strong style={{ color: 'var(--ink)' }}>{row.contact_email}</strong>.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Brand name</label>
            <input
              style={inputStyle}
              value={brandName}
              maxLength={200}
              disabled={busy || (choice !== 'new' && choice !== null && candidates.length > 0)}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>
          {row.brand_website ? (
            <p style={{ fontSize: 13, color: 'var(--ink-50)', marginBottom: 12 }}>
              Website: <span style={{ color: 'var(--ink)' }}>{row.brand_website}</span>
            </p>
          ) : null}
          {candidates.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Possible catalog match</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidates.map((c) => (
                  <label
                    key={c.brand_id}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      fontSize: 13,
                      color: 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="approve-choice"
                      checked={choice === c.brand_id}
                      disabled={busy}
                      onChange={() => setChoice(c.brand_id)}
                    />
                    <span>
                      Link to {c.brand_name} ({formatProducts(c.product_count)})
                    </span>
                  </label>
                ))}
                <label
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    fontSize: 13,
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="approve-choice"
                    checked={choice === 'new'}
                    disabled={busy}
                    onChange={() => setChoice('new')}
                  />
                  <span>Create new brand “{brandName.trim() || row.brand_name_typed}”</span>
                </label>
              </div>
            </div>
          ) : null}
        </>
      )}

      {row.already_claimed ? (
        <p style={{ fontSize: 13, color: 'var(--amber, #a66a14)', lineHeight: 1.5, marginBottom: 12 }}>
          A colleague already has portal access for this brand. Treat this as a second-employee
          request — Approve & invite is disabled until that path ships.
        </p>
      ) : null}

      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>
          Internal note <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
        </label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical' }}
          rows={2}
          value={notes}
          disabled={busy}
          onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
          placeholder="Internal note for this decision…"
        />
      </div>

      {error ? (
        <p style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.45, marginTop: 8 }}>{error}</p>
      ) : null}

      <Footer
        busy={busy}
        primaryLabel={linked || choice !== 'new' ? 'Send invite' : 'Create brand & send invite'}
        primaryDisabled={!canSubmit}
        onCancel={onClose}
        onPrimary={() => {
          if (linked) {
            onSubmit({
              existingBrandId: row.selected_brand_id,
              reviewNotes: notes.trim() || null,
            })
            return
          }
          if (typeof choice === 'number') {
            onSubmit({
              existingBrandId: choice,
              reviewNotes: notes.trim() || null,
            })
            return
          }
          onSubmit({
            brandName: brandName.trim(),
            confirmNew: candidates.length > 0,
            reviewNotes: notes.trim() || null,
          })
        }}
      />
    </DialogShell>
  )
}
