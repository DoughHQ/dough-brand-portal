'use client'

import type { CSSProperties } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { uniquePairs } from '@/lib/concept/publish'
import {
  inputBase,
  labelSm,
  sectionCard,
  sectionEyebrow,
  sectionHelp,
  sectionTitle,
} from './conceptStyles'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  disabled?: boolean
  disabledReason?: string | null
}

const stripItem = (ok: boolean): CSSProperties => ({
  fontSize: 12,
  fontWeight: 500,
  color: ok ? 'var(--sage)' : 'var(--red)',
})

/**
 * Battle settings — how many respondents you need and when the study closes.
 * Battle count is derived from field size (full round-robin).
 */
export default function BattleSettingsSection({
  draft,
  onChange,
  disabled,
  disabledReason,
}: Props) {
  const fieldSize = draft.conceptArms.length + draft.products.length
  const battles = uniquePairs(fieldSize)

  return (
    <section
      style={{
        ...sectionCard,
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      id="concept-battle-settings"
      aria-disabled={disabled || undefined}
    >
      <div style={sectionEyebrow}>Section 5 · Battle settings</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        Battle settings
      </h2>
      <p style={sectionHelp}>
        How many respondents you need and when the study closes. Every respondent
        sees a full round-robin — every item vs every other item.
      </p>

      {disabled && disabledReason ? (
        <p
          role="status"
          style={{
            margin: '0 0 18px',
            fontSize: 13,
            color: 'var(--ink-50)',
            background: 'var(--surface-1)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
          }}
        >
          {disabledReason}
        </p>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        <div>
          <label style={labelSm} htmlFor="field_target_completions">
            Target completions
          </label>
          <input
            id="field_target_completions"
            type="number"
            min={1}
            className="cb-input"
            value={draft.targetCompletions}
            onChange={(e) =>
              onChange({
                ...draft,
                targetCompletions: Math.max(1, Number(e.target.value) || 1),
              })
            }
            style={inputBase}
          />
        </div>
        <div>
          <label style={labelSm} htmlFor="field_expires_at">
            Expires
          </label>
          <input
            id="field_expires_at"
            className="cb-input"
            type="date"
            value={
              draft.expiresAt
                ? new Date(draft.expiresAt).toISOString().slice(0, 10)
                : ''
            }
            onChange={(e) => {
              const day = e.target.value
              onChange({
                ...draft,
                expiresAt: day
                  ? new Date(`${day}T23:59:59.000Z`).toISOString()
                  : '',
              })
            }}
            style={inputBase}
          />
        </div>
      </div>

      {!disabled ? (
        <div
          style={{
            marginTop: 22,
            padding: '12px 14px',
            borderRadius: 'var(--r-md)',
            background: 'var(--surface-1)',
            border: '1px solid var(--ink-10)',
          }}
        >
          <span style={stripItem(battles > 0)}>
            {battles > 0 ? '✓' : '✗'}{' '}
            {battles > 0
              ? `This study will run ${battles} battle${battles === 1 ? '' : 's'} per respondent — every item vs every item`
              : 'Add at least two field items to run battles'}
          </span>
        </div>
      ) : null}
    </section>
  )
}
