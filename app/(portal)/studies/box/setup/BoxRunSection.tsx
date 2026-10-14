import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS } from '@/lib/box/validity'
import {
  IHUT_COMPLETION_OVERAGE_PERCENT,
  IHUT_RESPONDENT_WINDOW_DAYS,
  ihutInventoryPlan,
} from '@/lib/box/completionContract'
import { PRODUCT_NAME } from '@/lib/brand'
import { inputBase, labelSm, runLede, subHelp } from './setupStyles'

function intFromInput(v: string): number | null {
  const t = v.trim()
  if (!t) return null
  if (!/^-?\d+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) ? n : null
}

export default function BoxRunSection({
  draft,
  onChange,
}: {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
}) {
  const inventory = ihutInventoryPlan(draft.targetCompletions)

  return (
    <div
      id={BOX_ANCHORS.logistics}
      style={{
        paddingTop: 8,
        borderTop: '1px solid var(--ink-10)',
      }}
    >
      <p style={{ ...runLede, marginBottom: 16 }}>How it runs</p>

      <div id={BOX_ANCHORS.units} style={{ marginBottom: 20 }}>
        <div style={labelSm}>Completed respondents</div>
        <input
          className="cb-input"
          inputMode="numeric"
          value={draft.targetCompletions ?? ''}
          onChange={(e) => {
            const targetCompletions = intFromInput(e.target.value)
            const nextInventory = ihutInventoryPlan(targetCompletions)
            onChange({
              ...draft,
              targetCompletions,
              physicalUnits: nextInventory?.physicalUnits ?? null,
            })
          }}
          placeholder="e.g. 100"
          aria-describedby="box-completion-help"
          style={{ ...inputBase, width: 180 }}
        />
        <p id="box-completion-help" style={{ ...subHelp, marginTop: 6, maxWidth: 480 }}>
          The completed responses the final report is built on.
        </p>
      </div>

      {inventory ? (
        <div className="box-completion-contract" role="status">
          <div className="box-completion-contract__eyebrow">{PRODUCT_NAME} fielding plan</div>
          <div className="box-completion-contract__headline">
            Prepare {inventory.physicalUnits} boxes
          </div>
          <p>
            {inventory.targetCompletions} for the completed field, plus{' '}
            {inventory.overageUnits} ({IHUT_COMPLETION_OVERAGE_PERCENT}%) for expected
            non-completion.
          </p>
          <p>
            Each respondent gets {IHUT_RESPONDENT_WINDOW_DAYS} days after delivery.
            Recruitment stops at the target; anyone already shipped can still finish.
          </p>
          <p>
            Runs until it&apos;s full, for up to 90 days. You can end it sooner. Households
            with a box still finish, and you get a report if at least 10 did.
          </p>
        </div>
      ) : (
        <div className="box-completion-contract is-empty">
          Enter a target to see the box plan.
        </div>
      )}

      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          cursor: 'pointer',
          maxWidth: 560,
          margin: '24px 0 0',
        }}
      >
        <input
          type="checkbox"
          checked={draft.blindSponsor}
          onChange={(e) =>
            onChange({ ...draft, blindSponsor: e.target.checked })
          }
          style={{ marginTop: 3 }}
        />
        <span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--ink-80)',
            }}
          >
            Hide our brand from respondents
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--ink-50)',
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            Respondents don&rsquo;t see who funded the box, reducing
            brand-affinity bias.
          </span>
        </span>
      </label>
    </div>
  )
}
