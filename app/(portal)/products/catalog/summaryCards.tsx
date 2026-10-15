export function n(value: number): string {
  return Math.max(0, Math.trunc(value)).toLocaleString()
}

function SageGlyph({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SummaryCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: number
  hint: string
  icon: string
}) {
  return (
    <div className="cat-summary-card">
      <div className="cat-summary-icon">
        <SageGlyph d={icon} />
      </div>
      <div>
        <div className="cat-summary-label">{label}</div>
        <div className="cat-summary-value">{n(value)}</div>
        <div className="cat-summary-hint">{hint}</div>
      </div>
    </div>
  )
}
