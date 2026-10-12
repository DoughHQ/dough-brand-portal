import {
  IHUT_GENERIC_ATTRIBUTES,
  type IhutAttributeCode,
} from '@/lib/box/method'
import { PRODUCT_NAME } from '@/lib/brand'

export default function AttributeEditor({
  selected,
  onToggle,
}: {
  selected: readonly IhutAttributeCode[]
  onToggle: (code: IhutAttributeCode) => void
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <p className="cb-acc-note" style={{ marginBottom: 10 }}>
        Pick 1–3 just-right checks. {PRODUCT_NAME} defaults are preselected.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {IHUT_GENERIC_ATTRIBUTES.map((a) => {
          const on = selected.includes(a.value)
          return (
            <button
              key={a.value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(a.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--r-sm)',
                border: `1px solid ${on ? 'var(--sage)' : 'var(--ink-10)'}`,
                background: on ? 'var(--sage-soft)' : 'var(--paper)',
                fontSize: 13,
                fontWeight: on ? 600 : 500,
                color: on ? 'var(--heading)' : 'var(--ink-80)',
                cursor: 'pointer',
              }}
            >
              {a.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
