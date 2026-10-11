import { chipRow, openPill, summaryChip } from './styles'

export default function AudienceSummary({
  open,
  chips,
}: {
  open: boolean
  chips: string[]
}) {
  if (open) {
    return <div style={openPill}>Open to everyone — no restrictions</div>
  }
  if (chips.length === 0) return null

  return (
    <div style={chipRow}>
      {chips.map((chip) => (
        <span key={chip} style={summaryChip}>
          {chip}
        </span>
      ))}
    </div>
  )
}
