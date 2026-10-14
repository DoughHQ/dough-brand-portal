'use client'

import { useMemo, useState } from 'react'
import { contactFirstName, type BrandApplication } from '@/lib/brandApplications'
import { DialogShell } from './DialogShell'
import { Footer } from './DialogFooter'
import { inputStyle, labelStyle } from './dialogStyles'

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
