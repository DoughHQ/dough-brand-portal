export default function ConceptReportPreviewBanner() {
  return (
    <div
      className="no-print"
      style={{
        background: 'var(--amber-soft)',
        color: 'var(--amber)',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        textAlign: 'center',
        padding: '8px 12px',
      }}
    >
      Preview fixture — not a live report. These numbers are an example of
      the format.
    </div>
  )
}
