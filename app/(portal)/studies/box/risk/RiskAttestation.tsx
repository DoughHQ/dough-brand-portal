'use client'

import type { ReactNode } from 'react'

export default function RiskAttestation({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, accentColor: 'var(--sage)' }}
      />
      <span style={{ fontSize: 14, color: 'var(--ink-80)', lineHeight: 1.45 }}>{children}</span>
    </label>
  )
}
