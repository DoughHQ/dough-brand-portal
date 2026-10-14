export type Tone = 'default' | 'destructive' | 'caution'

export const toneStyles: Record<
  Tone,
  { confirmBg: string; confirmColor: string; border: string }
> = {
  default: {
    confirmBg: 'var(--sage)',
    confirmColor: 'white',
    border: '1px solid var(--ink-10)',
  },
  caution: {
    confirmBg: 'var(--ink)',
    confirmColor: 'white',
    border: '1px solid var(--ink-10)',
  },
  destructive: {
    confirmBg: '#8B2E2E',
    confirmColor: 'white',
    border: '1px solid rgba(139, 46, 46, 0.35)',
  },
}
