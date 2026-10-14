import type { CSSProperties } from 'react'
import type { CompareGroupPeakBucket } from '@/lib/compareGroups.shared'

export type SortKey = 'name' | 'battles' | 'products' | 'respondents'
export type SortPreset = 'name' | 'respondents' | 'battles'
export type TodFilter = 'any' | CompareGroupPeakBucket | 'none'

export const TOD_OPTIONS: { value: TodFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'late', label: 'Late night' },
  { value: 'none', label: 'No priors' },
]

export const BATTLE_OPTS = [
  { value: 0, label: 'Any battles' },
  { value: 1, label: '≥1 battle' },
  { value: 10, label: '≥10 battles' },
  { value: 50, label: '≥50 battles' },
]

export const RESPONDENT_OPTS = [
  { value: 0, label: 'Any respondents' },
  { value: 1, label: '≥1 respondent' },
  { value: 5, label: '≥5 respondents' },
  { value: 10, label: '≥10 respondents' },
]

export function chipStyle(active: boolean): CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 999,
    border: active ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
    background: active ? 'var(--sage-pale, #eef5f0)' : 'var(--paper)',
    color: active ? 'var(--sage)' : 'var(--ink-50)',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  }
}

export const filterLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginRight: 4,
}
