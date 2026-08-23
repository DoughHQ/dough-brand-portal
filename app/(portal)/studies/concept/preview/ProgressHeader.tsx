type Props = {
  current: number
  total: number
}

export default function ProgressHeader({ current, total }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
  return (
    <div className="cpw-progress">
      <div className="cpw-progress-bar" aria-hidden>
        <div className="cpw-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="cpw-progress-label">
        {current} / {total}
      </span>
    </div>
  )
}
