import type { CSSProperties } from 'react'
import type { ReadinessStatus } from '@/lib/categoryReadiness.shared'

export const STATUS_STYLE: Record<
  ReadinessStatus,
  { label: string; color: string; bg: string }
> = {
  empty: { label: 'Empty', color: 'var(--ink-30)', bg: 'var(--surface-1)' },
  building: { label: 'Building', color: 'var(--ink-50)', bg: 'var(--surface-1)' },
  approaching: { label: 'Approaching', color: 'var(--amber, #C07818)', bg: 'var(--amber-pale, #FAEEDA)' },
  sellable: { label: 'Sellable', color: 'var(--sage, #3E6B4A)', bg: 'var(--sage-pale, #eef5f0)' },
}

export const inputStyle: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  background: 'var(--paper)',
  color: 'var(--ink)',
  width: 280,
}
