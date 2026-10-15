import type { CategoryScope } from '@/lib/categoryReport/types'
import { SCOPE_CHIP_LABEL } from '@/lib/categoryReport/scopeSearch'
import { isReadinessStatus } from '@/lib/categoryReadiness.shared'
import { STATUS_STYLE } from './scopeChrome'

export function StatusChip({ status }: { status: string }) {
  const style = isReadinessStatus(status) ? STATUS_STYLE[status] : null
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: style?.color ?? 'var(--ink-30)',
        background: style?.bg ?? 'var(--surface-1)',
        padding: '1px 6px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {style?.label ?? status}
    </span>
  )
}

export function ScopeChip({ scope }: { scope: CategoryScope }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--ink-50)',
        border: '1px solid var(--ink-10)',
        padding: '1px 6px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {SCOPE_CHIP_LABEL[scope]}
    </span>
  )
}
