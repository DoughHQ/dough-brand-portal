'use client'

import type { DietaryFlagGroup } from '@/lib/studies/audience/dietaryFlags'
import {
  allergyGroup,
  allergyHeading,
  groupHeading,
  labelSm,
  subHelp,
} from './styles'

type Props = {
  groups: DietaryFlagGroup[]
  status: 'loading' | 'ready' | 'error'
  selected: string[]
  open: boolean
  subject: string
  onOpenChange: (open: boolean) => void
  onChange: (selected: string[]) => void
}

export default function DietarySelector({
  groups,
  status,
  selected,
  open,
  subject,
  onOpenChange,
  onChange,
}: Props) {
  function toggle(code: string) {
    onChange(
      selected.includes(code)
        ? selected.filter((value) => value !== code)
        : [...selected, code]
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={labelSm}>Dietary match</div>
      {!open && selected.length === 0 ? (
        <>
          <p style={{ ...subHelp, marginBottom: 8 }}>
            Leave empty for no dietary requirement.
          </p>
          <button
            type="button"
            className="cb-btn cb-btn-secondary"
            onClick={() => onOpenChange(true)}
          >
            + Add dietary match
          </button>
        </>
      ) : (
        <>
          <p style={{ ...subHelp, marginBottom: 8 }}>
            {subject} must match every selected flag. Leave empty for no dietary
            requirement.
          </p>
          {status === 'loading' ? (
            <p style={subHelp}>Loading dietary flags…</p>
          ) : null}
          {status === 'error' ? (
            <p role="alert" style={{ ...subHelp, color: 'var(--red)' }}>
              Dietary flags couldn&rsquo;t load. Refresh and try again.
            </p>
          ) : null}
          {status === 'ready'
            ? groups.map((group) => {
                const allergy = group.category === 'allergy'
                return (
                  <div
                    key={group.category}
                    style={allergy ? allergyGroup : { marginBottom: 14 }}
                  >
                    <div style={allergy ? allergyHeading : groupHeading}>
                      {group.heading}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {group.flags.map((flag) => {
                        const active = selected.includes(flag.flag_code)
                        return (
                          <button
                            key={flag.flag_code}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggle(flag.flag_code)}
                            style={{
                              border: active
                                ? '1px solid var(--sage)'
                                : allergy
                                  ? '1px solid rgba(184, 121, 27, 0.45)'
                                  : '1px solid var(--ink-10)',
                              background: active
                                ? 'var(--sage-soft)'
                                : 'var(--paper)',
                              color: active
                                ? 'var(--heading)'
                                : 'var(--ink)',
                              borderRadius: 'var(--cb-radius-pill)',
                              padding: '8px 14px',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                              fontSize: 13,
                              fontWeight: active ? 600 : 500,
                            }}
                          >
                            {active ? '✓ ' : ''}
                            {flag.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            : null}
          {selected.length === 0 ? (
            <button
              type="button"
              className="cb-quiet-action"
              onClick={() => onOpenChange(false)}
            >
              Remove dietary match
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
