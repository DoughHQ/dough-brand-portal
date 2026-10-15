import { type CSSProperties } from 'react'

export type ApplyStep = 'search' | 'details' | 'booking'

export type Props = {
  step: ApplyStep
  setStep: (step: ApplyStep) => void
  error: string | null
  setError: (error: string | null) => void
  onGoToLogin: () => void
  styles: {
    cardStyle: CSSProperties
    inputStyle: CSSProperties
    labelStyle: CSSProperties
    primaryBtnStyle: (disabled: boolean) => CSSProperties
  }
}

function formatCount(n: number): string {
  return Math.max(0, Math.trunc(n)).toLocaleString()
}

/** Singular when n === 1 so search hits never say "1 products". */
export function formatProducts(n: number): string {
  const count = Math.max(0, Math.trunc(n))
  return count === 1 ? '1 product' : `${formatCount(count)} products`
}
