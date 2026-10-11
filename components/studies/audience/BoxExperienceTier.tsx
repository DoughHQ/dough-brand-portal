'use client'

import {
  BOX_TRIED_LOOP_BODY,
  BOX_TRIED_LOOP_TITLE,
} from '@/lib/box/constants'
import type {
  BoxEligibilityTier,
  BoxStudyDraft,
} from '@/lib/box/types'
import { eligibilityTierLabel } from '@/lib/box/validity'
import { InfoButton } from './AudienceControls'
import { labelSm } from './styles'

const V1_TIERS: BoxEligibilityTier[] = ['any', 'tried', 'not_tried']

export default function BoxExperienceTier({
  draft,
  onChange,
}: {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div id="box-aud-tier-label" style={labelSm}>
        Experience with the hero product
      </div>
      <div
        role="radiogroup"
        aria-labelledby="box-aud-tier-label"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 560,
        }}
      >
        {V1_TIERS.map((tier) => {
          const active = draft.eligibilityTier === tier
          return (
            <div
              key={tier}
              style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}
            >
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  onChange({ ...draft, eligibilityTier: tier })
                }
                style={{
                  flex: 1,
                  textAlign: 'left',
                  border: active
                    ? '1px solid var(--sage)'
                    : '1px solid var(--ink-10)',
                  background: active
                    ? 'var(--sage-soft)'
                    : 'var(--paper)',
                  borderRadius: 'var(--r-sm)',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--heading)' : 'var(--ink)',
                }}
              >
                {eligibilityTierLabel(tier)}
              </button>
              {tier === 'tried' ? (
                <InfoButton
                  title={BOX_TRIED_LOOP_TITLE}
                  body={BOX_TRIED_LOOP_BODY}
                  ariaLabel="What counts as tried?"
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
