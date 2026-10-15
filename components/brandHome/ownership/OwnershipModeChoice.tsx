import type { OwnershipCorrectionState } from './useOwnershipCorrection'

export function OwnershipModeChoice({
  mode,
  setMode,
  setSelected,
  setQuery,
}: Pick<OwnershipCorrectionState, 'mode' | 'setMode' | 'setSelected' | 'setQuery'>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: 'pointer',
          fontSize: 13,
          color: 'var(--ink)',
        }}
      >
        <input
          type="radio"
          name="ownership-mode"
          checked={mode === 'has_parent'}
          onChange={() => setMode('has_parent')}
          style={{ marginTop: 3 }}
        />
        <span>This brand’s parent company is…</span>
      </label>
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: 'pointer',
          fontSize: 13,
          color: 'var(--ink)',
        }}
      >
        <input
          type="radio"
          name="ownership-mode"
          checked={mode === 'independent'}
          onChange={() => {
            setMode('independent')
            setSelected(null)
            setQuery('')
          }}
          style={{ marginTop: 3 }}
        />
        <span>This brand is independent (no parent company)</span>
      </label>
    </div>
  )
}
