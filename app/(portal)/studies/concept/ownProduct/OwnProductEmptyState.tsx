function PackageGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block', margin: '0 auto 12px', color: 'var(--ink-50)' }}
    >
      <path
        d="M12 2.75l7.5 4v10.5l-7.5 4-7.5-4V6.75l7.5-4z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M4.5 6.75L12 10.75l7.5-4M12 10.75v10.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export default function OwnProductEmptyState({
  onStart,
  disabled,
}: {
  onStart: () => void
  disabled?: boolean
}) {
  return (
    <div
      style={{
        border: 'var(--cb-border-dashed)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--cb-surface-muted)',
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <PackageGlyph />
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-80)',
          marginBottom: 8,
        }}
      >
        Add your product
      </div>
      <p
        style={{
          margin: '0 auto 16px',
          maxWidth: 280,
          fontSize: 13,
          color: 'var(--ink-50)',
          lineHeight: 1.45,
        }}
      >
        Set up the product or concept respondents will evaluate in this study.
      </p>
      <button
        type="button"
        className="cb-btn-outline"
        onClick={onStart}
        disabled={disabled}
      >
        + Add your product
      </button>
    </div>
  )
}
