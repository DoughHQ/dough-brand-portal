import { boxStatusLabel, BOX_STATUS_TONE, type BoxStatus } from '@/lib/box/operator'

export function StatusBadge({ status }: { status: BoxStatus }) {
  const tone = BOX_STATUS_TONE[status]
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 'var(--r-sm)',
        background: tone.bg,
        color: tone.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {boxStatusLabel(status)}
    </span>
  )
}
