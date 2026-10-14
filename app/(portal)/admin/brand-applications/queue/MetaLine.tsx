import type { ReactNode } from 'react'

export function MetaLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
      <span style={{ color: 'var(--ink-30)', fontWeight: 500 }}>{label} </span>
      {children}
    </div>
  )
}
