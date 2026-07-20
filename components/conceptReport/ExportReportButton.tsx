'use client'

export function ExportReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--sage-dark)',
        background: 'var(--paper)',
        border: '1px solid var(--mist)',
        borderRadius: 6,
        padding: '8px 14px',
        cursor: 'pointer',
      }}
    >
      Export report
    </button>
  )
}
