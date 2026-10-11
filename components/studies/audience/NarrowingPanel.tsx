'use client'

import type { DietaryFlagGroup } from '@/lib/studies/audience/dietaryFlags'
import DietarySelector from './DietarySelector'
import StateMultiSelect from './StateMultiSelect'
import { intFromInput } from './integer'
import { inputBase, labelSm, panel, subHelp } from './styles'
import type {
  AudienceEligibility,
  PatchAudienceEligibility,
} from './types'

type Props = {
  anchorId: string
  eligibility: AudienceEligibility
  dietaryGroups: DietaryFlagGroup[]
  dietaryStatus: 'loading' | 'ready' | 'error'
  patch: PatchAudienceEligibility
  narrowOpen: boolean
  narrowSet: boolean
  onNarrowOpenChange: (open: boolean) => void
  dietaryOpen: boolean
  onDietaryOpenChange: (open: boolean) => void
  stateLabel: string
  stateHelp: string
  dietarySubject: string
  accountAgeHelp: string
}

export default function NarrowingPanel({
  anchorId,
  eligibility,
  dietaryGroups,
  dietaryStatus,
  patch,
  narrowOpen,
  narrowSet,
  onNarrowOpenChange,
  dietaryOpen,
  onDietaryOpenChange,
  stateLabel,
  stateHelp,
  dietarySubject,
  accountAgeHelp,
}: Props) {
  return (
    <div id={anchorId} style={{ marginBottom: 28 }}>
      {!narrowOpen ? (
        <button
          type="button"
          className="cb-btn cb-btn-secondary"
          onClick={() => onNarrowOpenChange(true)}
        >
          + Narrow further
        </button>
      ) : (
        <div style={panel}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ ...labelSm, marginBottom: 0 }}>Narrow further</div>
            {!narrowSet ? (
              <button
                type="button"
                className="cb-quiet-action"
                onClick={() => {
                  onNarrowOpenChange(false)
                  onDietaryOpenChange(false)
                }}
              >
                Hide
              </button>
            ) : null}
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={labelSm}>{stateLabel}</div>
            <p style={{ ...subHelp, marginBottom: 8 }}>{stateHelp}</p>
            <StateMultiSelect
              selected={eligibility.targetStates}
              onChange={(targetStates) => patch({ targetStates })}
            />
          </div>

          <DietarySelector
            groups={dietaryGroups}
            status={dietaryStatus}
            selected={eligibility.requiredDietaryFlags}
            open={dietaryOpen}
            subject={dietarySubject}
            onOpenChange={onDietaryOpenChange}
            onChange={(requiredDietaryFlags) =>
              patch({ requiredDietaryFlags })
            }
          />

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={labelSm}>Age range</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className="cb-input"
                  inputMode="numeric"
                  value={eligibility.minAge ?? ''}
                  onChange={(event) =>
                    patch({ minAge: intFromInput(event.target.value) })
                  }
                  placeholder="Min"
                  style={{ ...inputBase, width: 90 }}
                />
                <span style={{ color: 'var(--ink-30)' }}>–</span>
                <input
                  className="cb-input"
                  inputMode="numeric"
                  value={eligibility.maxAge ?? ''}
                  onChange={(event) =>
                    patch({ maxAge: intFromInput(event.target.value) })
                  }
                  placeholder="Max"
                  style={{ ...inputBase, width: 90 }}
                />
              </div>
              <p style={{ ...subHelp, marginTop: 6 }}>Leave blank for any age.</p>
            </div>
            <div>
              <div style={labelSm}>Minimum account age (days)</div>
              <input
                className="cb-input"
                inputMode="numeric"
                value={eligibility.minAccountAgeDays ?? ''}
                onChange={(event) =>
                  patch({
                    minAccountAgeDays: intFromInput(event.target.value),
                  })
                }
                placeholder="e.g. 14"
                style={{ ...inputBase, width: 140 }}
              />
              <p style={{ ...subHelp, marginTop: 6, maxWidth: 220 }}>
                {accountAgeHelp}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
