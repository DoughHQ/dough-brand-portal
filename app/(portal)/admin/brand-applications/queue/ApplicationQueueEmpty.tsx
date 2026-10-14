export function ApplicationQueueEmpty() {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        padding: '48px 32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 20,
          color: 'var(--ink)',
          marginBottom: 8,
        }}
      >
        Queue is clear
      </div>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: 0, lineHeight: 1.5 }}>
        No applications yet.
      </p>
    </div>
  )
}
