'use client'

import type { CSSProperties } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { evaluateFieldValidity } from '@/lib/concept/validity'
import { defaultScoringRounds, uniquePairs } from '@/lib/concept/publish'
import { templateFieldAnchor } from '@/lib/concept/templateConfig'
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
  onScoringTouched?: () => void
}

const stripItem = (ok: boolean): CSSProperties => ({
  fontSize: 12,
  fontWeight: 500,
  color: ok ? 'var(--sage)' : 'var(--red)',
})

/**
 * Battle settings — how the field is scored and how many respondents are needed.
 * Universal across every study mode; rendered as the last section of the builder.
 */
export default function BattleSettingsSection({
  draft,
  onChange,
  disabled,
  disabledReason,
  onScoringTouched,
}: Props) {
  const validity = evaluateFieldValidity(draft)
  const fieldSize = draft.conceptArms.length + draft.products.length
  const pairs = uniquePairs(fieldSize)
  const recommended = defaultScoringRounds(fieldSize)

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
      <div style={sectionEyebrow}>Section 3 · Battle settings</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        Battle settings
      </h2>
      <p style={sectionHelp}>
        How the field is scored and how many respondents you need. Applies to every study
        type.
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
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 14,
        }}
      >
        <div id={templateFieldAnchor('scoring_rounds')}>
          <label style={labelSm} htmlFor="field_scoring_rounds">
            Rounds / respondent
          </label>
          <input
            id="field_scoring_rounds"
            type="number"
            min={1}
            max={10}
            className="cb-input"
            value={draft.scoringRounds}
            onChange={(e) => {
              onScoringTouched?.()
              const n = Math.min(10, Math.max(1, Number(e.target.value) || 1))
              onChange({ ...draft, scoringRounds: n })
            }}
            style={inputBase}
          />
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-50)' }}>
            {draft.scoringRounds < pairs
              ? `${draft.scoringRounds} of ${pairs} pairs · recommended ${recommended}`
              : `${pairs} unique pairs in field`}
          </p>
        </div>
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
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 22px',
            alignItems: 'center',
          }}
        >
          <span style={stripItem(validity.pairings > 0)}>
            {validity.pairings > 0 ? '✓' : '✗'} {validity.pairings} pairing
            {validity.pairings === 1 ? '' : 's'}/respondent
          </span>
        </div>
      ) : null}
    </section>
  )
}
