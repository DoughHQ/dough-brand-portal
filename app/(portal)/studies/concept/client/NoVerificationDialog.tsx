export default function NoVerificationDialog({
  publishing,
  onAddBrands,
  onPublish,
}: {
  publishing: boolean
  onAddBrands: () => void
  onPublish: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-verification-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(20, 24, 20, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          borderRadius: 'var(--r-lg)',
          maxWidth: 440,
          width: '100%',
          padding: 24,
          boxShadow: 'var(--cb-shadow-modal)',
        }}
      >
        <h2
          id="no-verification-title"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--ink-80)',
            margin: '0 0 8px',
          }}
        >
          Publish without purchase verification?
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}>
          You haven’t added verification brands. Respondents won’t be screened on
          recent purchase — anyone in the category can qualify. You can still publish.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={onAddBrands}
            style={{
              border: '1px solid var(--ink-10)',
              background: 'var(--paper)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 36,
              padding: '0 16px',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
            }}
          >
            Add brands
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            style={{
              border: 'none',
              background: 'var(--sage)',
              color: 'var(--on-fill)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 36,
              padding: '0 16px',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
              opacity: publishing ? 0.7 : 1,
            }}
          >
            Publish anyway
          </button>
        </div>
      </div>
    </div>
  )
}
