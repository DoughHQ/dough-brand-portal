'use client'

import {
  pickableModulesFor,
  type StudyModuleCode,
  type StudyTestType,
} from '@/lib/study/modules'

type Props = {
  testType: StudyTestType
  selected: readonly StudyModuleCode[]
  onChange: (next: StudyModuleCode[]) => void
  disabled?: boolean
}

/**
 * Presentation-only multi-select for config-free analysis modules.
 * State lives on the draft. No RPC, no config sub-forms.
 */
export default function ModulesPicker({
  testType,
  selected,
  onChange,
  disabled,
}: Props) {
  const options = pickableModulesFor(testType)

  function toggle(code: StudyModuleCode) {
    if (disabled) return
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code))
      return
    }
    onChange([...selected, code])
  }

  return (
    <div
      role="group"
      aria-label="Optional analysis modules"
      style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}
    >
      {options.map((mod) => {
        const on = selected.includes(mod.code)
        const inputId = `module-${testType}-${mod.code}`
        return (
          <label
            key={mod.code}
            htmlFor={inputId}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              margin: 0,
              padding: '14px 16px',
              border: on ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
              background: on ? 'var(--sage-soft)' : 'var(--white)',
              borderRadius: 'var(--r-md)',
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <input
              id={inputId}
              type="checkbox"
              checked={on}
              disabled={disabled}
              onChange={() => toggle(mod.code)}
              style={{ marginTop: 3, accentColor: 'var(--sage)' }}
            />
            <span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: on ? 600 : 500,
                  color: on ? 'var(--sage-dark)' : 'var(--ink-80)',
                }}
              >
                {mod.label}
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--ink-50)',
                  marginTop: 3,
                  lineHeight: 1.4,
                }}
              >
                {mod.description}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
