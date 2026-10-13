export default function ConceptDraftMissing({ onStartNew }: { onStartNew: () => void }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 560,
        margin: '80px auto',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400 }}>
        Draft not found
      </h1>
      <p style={{ color: 'var(--ink-50)', fontSize: 14 }}>
        This concept draft isn&apos;t in this browser. Start a new one, or open it where it
        was saved.
      </p>
      <button
        type="button"
        onClick={onStartNew}
        style={{
          marginTop: 16,
          border: 'none',
          background: 'var(--sage)',
          color: 'var(--on-fill)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 600,
          padding: '10px 18px',
          borderRadius: 'var(--r-sm)',
          cursor: 'pointer',
        }}
      >
        New concept study
      </button>
    </div>
  )
}
