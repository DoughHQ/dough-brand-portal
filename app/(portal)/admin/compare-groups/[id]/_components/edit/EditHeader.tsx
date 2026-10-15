export function EditHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
        Edit details
      </h2>
      <button
        type="button"
        onClick={onClose}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 20,
          color: 'var(--ink-30)',
          lineHeight: 1,
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  )
}
