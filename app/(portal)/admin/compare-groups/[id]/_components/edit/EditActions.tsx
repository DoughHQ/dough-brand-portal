import type { EditDetailsState } from './useEditDetails'

export function EditActions({
  onClose,
  saving,
}: { onClose: () => void } & Pick<EditDetailsState, 'saving'>) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
      <button
        type="submit"
        disabled={saving}
        style={{
          padding: '10px 16px',
          borderRadius: 6,
          border: 'none',
          background: 'var(--sage)',
          color: 'var(--on-fill, #fff)',
          fontSize: 14,
          fontWeight: 500,
          cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.7 : 1,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        style={{
          padding: '10px 16px',
          borderRadius: 6,
          border: '1px solid var(--ink-10)',
          background: 'var(--paper)',
          color: 'var(--ink-50)',
          fontSize: 14,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Cancel
      </button>
    </div>
  )
}
