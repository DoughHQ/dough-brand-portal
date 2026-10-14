import type { ReadinessStatus } from '@/lib/categoryReadiness.shared'

export const STATUS_STYLE: Record<
  ReadinessStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  empty: {
    label: 'Empty',
    color: 'var(--ink-30)',
    bg: 'var(--surface-1)',
    border: 'var(--ink-10)',
  },
  building: {
    label: 'Building',
    color: 'var(--ink-50)',
    bg: 'var(--paper)',
    border: 'var(--ink-10)',
  },
  approaching: {
    label: 'Approaching',
    color: 'var(--amber, #C07818)',
    bg: 'var(--amber-pale, #FAEEDA)',
    border: 'rgba(192,120,24,0.25)',
  },
  sellable: {
    label: 'Sellable',
    color: 'var(--sage, #3E6B4A)',
    bg: 'var(--sage-pale, #eef5f0)',
    border: 'rgba(62,107,74,0.28)',
  },
}
