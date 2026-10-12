import type { ConceptStudyDraft, PricePosture } from '@/lib/concept/types'
import { PRICE_POSTURE_OPTIONS } from '@/lib/concept/constants'
import { pricePostureHelp } from '@/lib/concept/validity'
import { labelSm } from '../conceptStyles'

export default function PricePosturePicker({
  blindImageMode,
  draft,
  onChange,
}: {
  blindImageMode: boolean
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
}) {
  if (blindImageMode) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={labelSm}>Price posture</div>
      <div
        role="group"
        aria-label="Price posture"
        style={{
          display: 'inline-flex',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-sm)',
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        {PRICE_POSTURE_OPTIONS.map((opt, i) => {
          const active = draft.pricePosture === opt.value
          const isLast = i === PRICE_POSTURE_OPTIONS.length - 1
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onChange({ ...draft, pricePosture: opt.value as PricePosture })
              }
              style={{
                border: 'none',
                borderRight: isLast ? 'none' : '1px solid var(--ink-10)',
                background: active ? 'var(--sage)' : 'var(--paper)',
                color: active ? 'var(--on-fill)' : 'var(--ink-50)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                height: 48,
                padding: '0 16px',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.4 }}>
        {pricePostureHelp(draft.pricePosture)}
      </p>
    </div>
  )
}
