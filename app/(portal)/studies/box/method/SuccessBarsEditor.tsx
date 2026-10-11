import type { IhutSuccessBarsDraft } from '@/lib/box/method'
import { labelSm, pct, subHelp } from './methodStyles'

export default function SuccessBarsEditor({
  bars,
  onChange,
  priceCheckEnabled,
}: {
  bars: IhutSuccessBarsDraft
  onChange: (next: IhutSuccessBarsDraft) => void
  priceCheckEnabled: boolean
}) {
  const rows: {
    key: keyof IhutSuccessBarsDraft
    label: string
    help: string
    disabled?: boolean
  }[] = [
    {
      key: 'tasteWinShare',
      label: 'Taste win share',
      help: 'Your product’s win rate in taste battles',
    },
    {
      key: 'likingShare',
      label: 'Top-box liking',
      help: 'Share who rate your product in the top liking boxes',
    },
    {
      key: 'buyAtPriceShare',
      label: 'Buy at shelf price',
      help: priceCheckEnabled
        ? 'Share who’d buy your product at the listed shelf price. Judged only after 30+ answers.'
        : 'Disabled until every packaged seat has a positive shelf price.',
      disabled: !priceCheckEnabled,
    },
  ]

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ ...subHelp, margin: 0 }}>
        These are your pre-field decision thresholds — frozen at publish and judged
        against intervals, not point estimates.
      </p>
      {!priceCheckEnabled ? (
        <p
          role="status"
          style={{
            margin: 0,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--amber-soft, #fbf3e3)',
            border: '1px solid rgba(180, 120, 40, 0.25)',
            fontSize: 12,
            color: 'var(--ink-80)',
          }}
        >
          Price checks are off. Add a shelf price on every packaged seat in the field,
          or this bar will be reported as not tested.
        </p>
      ) : null}
      {rows.map((row) => (
        <label
          key={row.key}
          style={{
            display: 'block',
            margin: 0,
            opacity: row.disabled ? 0.55 : 1,
          }}
        >
          <span style={{ ...labelSm, display: 'block' }}>
            {row.label} · {pct(bars[row.key])}
          </span>
          <input
            type="range"
            min={10}
            max={95}
            step={1}
            disabled={row.disabled}
            value={Math.round(bars[row.key] * 100)}
            onChange={(e) =>
              onChange({
                ...bars,
                [row.key]: Number(e.target.value) / 100,
              })
            }
            style={{ width: '100%', maxWidth: 360, accentColor: 'var(--sage)' }}
          />
          <span style={{ ...subHelp, display: 'block', marginTop: 2 }}>{row.help}</span>
        </label>
      ))}
    </div>
  )
}
