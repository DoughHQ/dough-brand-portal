import type { CategoryScope } from '@/lib/categoryReport/types'
import { inputStyle } from './scopeChrome'
import { ScopeChip } from './scopeChips'

export function ScopeSearchSelection({
  scope,
  displayName,
  reset,
  setEditing,
  onClear,
}: {
  scope: CategoryScope
  displayName: string
  reset: () => void
  setEditing: (value: boolean) => void
  onClear: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={() => {
          reset()
          setEditing(true)
        }}
        title="Change category"
        style={{
          ...inputStyle,
          width: 'auto',
          minWidth: 200,
          maxWidth: 360,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <ScopeChip scope={scope} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {displayName}
        </span>
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear category"
        style={{
          ...inputStyle,
          width: 'auto',
          padding: '8px 10px',
          color: 'var(--ink-50)',
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </div>
  )
}
