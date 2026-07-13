/** Persistent integrity banner — print-safe, not dismissable. */

const SIMULATED_COPY =
  'Simulated data — this report was generated from synthetic respondents for demonstration. The numbers are real computations, but the people are not. Not evidence about real preferences.'

function FlaskIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 2v7.5L4.2 19.2A2 2 0 0 0 5.9 22h12.2a2 2 0 0 0 1.7-2.8L14 9.5V2" />
      <path d="M8.5 2h7" />
      <path d="M7 14h10" />
    </svg>
  )
}

export function SimulatedDataBanner() {
  return (
    <div
      className="concept-report-simulated-banner"
      role="status"
      aria-live="polite"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: 'var(--bg-warning)',
        color: 'var(--text-warning)',
        borderBottom: '1px solid rgba(138, 75, 15, 0.22)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 1,
          display: 'inline-flex',
        }}
      >
        <FlaskIcon />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Simulated — demo data
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {SIMULATED_COPY}
        </p>
      </div>
    </div>
  )
}
