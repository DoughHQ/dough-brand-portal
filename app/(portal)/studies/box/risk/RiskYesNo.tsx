'use client'

export default function RiskYesNo({
  name,
  value,
  disabled = false,
  onChange,
}: {
  name: string
  value: boolean | null
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div role="radiogroup" style={{ display: 'flex', gap: 20 }}>
      {[true, false].map((v) => (
        <label
          key={String(v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            cursor: disabled ? 'default' : 'pointer',
            color: disabled ? 'var(--ink-50)' : 'var(--ink-80)',
          }}
        >
          <input
            type="radio"
            name={name}
            checked={value === v}
            disabled={disabled}
            onChange={() => onChange(v)}
            style={{ accentColor: 'var(--sage)' }}
          />
          {v ? 'Yes' : 'No'}
        </label>
      ))}
    </div>
  )
}
