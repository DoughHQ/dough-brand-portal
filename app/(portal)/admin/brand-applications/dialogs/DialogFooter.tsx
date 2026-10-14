export function Footer({
  busy,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  onCancel,
}: {
  busy: boolean
  primaryLabel: string
  primaryDisabled?: boolean
  onPrimary: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
      <button
        type="button"
        disabled={busy}
        onClick={onCancel}
        style={{
          padding: '8px 14px',
          background: 'transparent',
          border: '1px solid var(--ink-10)',
          borderRadius: 6,
          fontSize: 13,
          cursor: busy ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          color: 'var(--ink)',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={busy || primaryDisabled}
        onClick={onPrimary}
        style={{
          padding: '8px 14px',
          background: 'var(--sage)',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: busy || primaryDisabled ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          opacity: busy || primaryDisabled ? 0.55 : 1,
        }}
      >
        {busy ? 'Working…' : primaryLabel}
      </button>
    </div>
  )
}
