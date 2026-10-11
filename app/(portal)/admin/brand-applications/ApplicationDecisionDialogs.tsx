'use client'

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  contactFirstName,
  formatProductCount,
  type BrandApplication,
  type CatalogCandidate,
} from '@/lib/brandApplications'

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(28, 38, 32, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 80,
  padding: 24,
}

const panelStyle: CSSProperties = {
  background: 'var(--paper)',
  borderRadius: 12,
  border: '1px solid var(--ink-10)',
  maxWidth: 480,
  width: '100%',
  padding: '22px 24px',
  boxShadow: '0 12px 40px rgba(28, 38, 32, 0.18)',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 6,
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  color: 'var(--ink)',
  outline: 'none',
}

function formatProducts(n: number): string {
  const count = Math.max(0, Math.trunc(n))
  return count === 1 ? '1 product' : `${count.toLocaleString()} products`
}

function DialogShell({
  title,
  children,
  onClose,
  busy,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  busy?: boolean
}) {
  return (
    <div
      style={overlayStyle}
      role="presentation"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            color: 'var(--ink)',
            marginBottom: 12,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}

function Footer({
  busy,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  onCancel,
}: {
  busy: boolean
  primaryLabel: string
  primaryDisabled?: boolean
  onPrimary: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
      <button
        type="button"
        disabled={busy}
        onClick={onCancel}
        style={{
          padding: '8px 14px',
          background: 'transparent',
          border: '1px solid var(--ink-10)',
          borderRadius: 6,
          fontSize: 13,
          cursor: busy ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          color: 'var(--ink)',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={busy || primaryDisabled}
        onClick={onPrimary}
        style={{
          padding: '8px 14px',
          background: 'var(--sage)',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: busy || primaryDisabled ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          opacity: busy || primaryDisabled ? 0.55 : 1,
        }}
      >
        {busy ? 'Working…' : primaryLabel}
      </button>
    </div>
  )
}

export type ApproveSubmit = {
  brandName?: string
  existingBrandId?: number | null
  confirmNew?: boolean
  reviewNotes: string | null
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

export function RejectDialog({
  row,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  row: BrandApplication
  busy: boolean
  error: string | null
  onClose: () => void
  onSubmit: (input: { reviewNotes: string | null; sendEmail: boolean }) => void
}) {
  const first = contactFirstName(row.contact_name)
  const [notes, setNotes] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const preview = useMemo(() => {
    const hi = first ? `Hi ${first},` : 'Hi there,'
    return `${hi}\n\nThanks for your interest in Runoff. We're not able to open a workspace for ${row.brand_name_typed} right now. If anything changes on your side, reply to this email — a person reads every reply.\n\n— Kyle`
  }, [first, row.brand_name_typed])

  return (
    <DialogShell title="Reject application" onClose={onClose} busy={busy}>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>
          Internal note <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
        </label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical' }}
          rows={2}
          value={notes}
          disabled={busy}
          onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
        />
      </div>
      <label
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
          fontSize: 13,
          color: 'var(--ink)',
          marginBottom: 8,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={sendEmail}
          disabled={busy}
          onChange={(e) => setSendEmail(e.target.checked)}
        />
        <span>Email {first || 'them'} a short reply</span>
      </label>
      {sendEmail ? (
        <pre
          style={{
            margin: '0 0 8px',
            padding: '10px 12px',
            background: 'var(--surface-1)',
            borderRadius: 8,
            border: '1px solid var(--ink-10)',
            fontSize: 12,
            color: 'var(--ink-50)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.5,
          }}
        >
          {preview}
        </pre>
      ) : null}
      {error ? (
        <p style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.45 }}>{error}</p>
      ) : null}
      <Footer
        busy={busy}
        primaryLabel="Reject"
        onCancel={onClose}
        onPrimary={() =>
          onSubmit({ reviewNotes: notes.trim() || null, sendEmail })
        }
      />
    </DialogShell>
  )
}

export function ConfirmDialog({
  title,
  body,
  primaryLabel,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  title: string
  body: string
  primaryLabel: string
  busy: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <DialogShell title={title} onClose={onClose} busy={busy}>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>{body}</p>
      {error ? (
        <p style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.45, marginTop: 8 }}>{error}</p>
      ) : null}
      <Footer
        busy={busy}
        primaryLabel={primaryLabel}
        onCancel={onClose}
        onPrimary={onConfirm}
      />
    </DialogShell>
  )
}
