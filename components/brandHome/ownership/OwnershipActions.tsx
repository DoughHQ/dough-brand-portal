import type { OwnershipCorrectionState } from './useOwnershipCorrection'

export function OwnershipActions({
  onClose,
  error,
  saving,
  optionsError,
  mode,
  loadingOptions,
  submit,
}: { onClose: () => void } & Pick<
  OwnershipCorrectionState,
  'error' | 'saving' | 'optionsError' | 'mode' | 'loadingOptions' | 'submit'
>) {
  return (
    <>
      {error ? (
        <div style={{ fontSize: 12, color: 'var(--red, #b42318)', marginBottom: 12 }}>{error}</div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: '1px solid var(--ink-10)',
            borderRadius: 6,
            fontSize: 13,
            color: 'var(--ink-50)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving || Boolean(optionsError) || (mode === 'has_parent' && loadingOptions)}
          style={{
            padding: '8px 14px',
            background: 'var(--sage)',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            color: 'white',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Submitting…' : 'Submit correction'}
        </button>
      </div>
    </>
  )
}
