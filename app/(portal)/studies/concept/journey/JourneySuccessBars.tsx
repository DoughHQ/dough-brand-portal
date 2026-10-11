import type { SuccessBarsDraft } from '@/lib/concept/singleTest'
import { headToHeadWinSentence, priceWinSentence } from '@/lib/concept/singleTest'

export default function JourneySuccessBars({
  bars,
  priceLabel,
  onChange,
}: {
  bars: SuccessBarsDraft
  priceLabel: string | null
  onChange: (b: SuccessBarsDraft) => void
}) {
  return (
    <div className="cb-win">
      <BarRow
        sentence={headToHeadWinSentence(bars.h2h)}
        doughDefault="50%"
        state={bars.h2h}
        onDefault={() => onChange({ ...bars, h2h: { kind: 'default' } })}
        onOff={() => onChange({ ...bars, h2h: { kind: 'off' } })}
        onCustom={(v) => onChange({ ...bars, h2h: { kind: 'custom', value: v } })}
      />
      <BarRow
        sentence={priceWinSentence(bars.price, priceLabel)}
        doughDefault="50%"
        state={bars.price}
        onDefault={() => onChange({ ...bars, price: { kind: 'default' } })}
        onOff={() => onChange({ ...bars, price: { kind: 'off' } })}
        onCustom={(v) => onChange({ ...bars, price: { kind: 'custom', value: v } })}
      />
    </div>
  )
}

function BarRow({
  sentence,
  doughDefault,
  state,
  onDefault,
  onOff,
  onCustom,
}: {
  sentence: string
  doughDefault: string
  state: SuccessBarsDraft['h2h']
  onDefault: () => void
  onOff: () => void
  onCustom: (v: number) => void
}) {
  const value = state.kind === 'custom' ? state.value : 0.5
  const shown =
    state.kind === 'off'
      ? 'Off'
      : state.kind === 'default'
        ? doughDefault
        : `${Math.round(state.value * 100)}%`

  return (
    <div className="cb-win-bar">
      <p className="cb-win-sentence">{sentence}</p>
      <div className="cb-win-bar-controls">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          aria-label={sentence}
          disabled={state.kind === 'off'}
          onChange={(e) => onCustom(Number(e.target.value))}
        />
        <strong className="cb-win-bar-value">{shown}</strong>
        <button type="button" className="cb-quiet-action" onClick={onDefault}>
          Use {doughDefault}
        </button>
        <button type="button" className="cb-quiet-action" onClick={onOff}>
          Off
        </button>
      </div>
    </div>
  )
}
