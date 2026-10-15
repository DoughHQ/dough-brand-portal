export function LauncherError({ error }: { error: string }) {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--mist)',
        borderRadius: 13,
        padding: '28px',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          fontWeight: 400,
          margin: '0 0 8px',
          color: 'var(--heading)',
        }}
      >
        Couldn’t load categories
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: 0, lineHeight: 1.55 }}>{error}</p>
    </div>
  )
}
