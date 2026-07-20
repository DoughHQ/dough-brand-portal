'use client'

import { useState, type ReactNode } from 'react'
import { SUPPORT_EMAIL, supportHref } from '@/lib/productMaster/support'
import { button, caption } from '@/lib/productMaster/styles'

/** Stub for write paths that have no RPC yet. */
export function ComingSoonStub({
  label,
  subject,
}: {
  label: string
  subject: string
}) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={button}>
        {label}
      </button>
    )
  }
  return (
    <div
      style={{
        marginTop: 8,
        padding: '12px 14px',
        background: 'var(--cream, #faf8f3)',
        border: '1px solid var(--ink-10)',
        borderRadius: 8,
        ...caption,
      }}
    >
      Coming soon. For now, email{' '}
      <a href={supportHref(subject)} style={{ color: 'var(--sage)' }}>
        {SUPPORT_EMAIL}
      </a>
      .
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{ ...button, marginLeft: 10, padding: '4px 10px' }}
      >
        Dismiss
      </button>
    </div>
  )
}

export function SupportLink({
  children,
  subject,
}: {
  children: ReactNode
  subject: string
}) {
  return (
    <a href={supportHref(subject)} style={{ color: 'var(--sage)', textDecoration: 'underline', fontSize: 15 }}>
      {children}
    </a>
  )
}
