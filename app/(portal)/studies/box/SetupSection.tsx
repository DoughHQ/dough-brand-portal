'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS, type BoxPublishFailure } from '@/lib/box/validity'
import { summarizeBoxSetup } from '@/lib/box/builderSummaries'
import {
  getTaxonomyNodeAction,
  type TaxonomyNodeInfo,
} from '../concept/actions'
import CategoryCombobox from '../concept/CategoryCombobox'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import {
  IHUT_COMPLETION_OVERAGE_PERCENT,
  IHUT_RESPONDENT_WINDOW_DAYS,
  ihutInventoryPlan,
} from '@/lib/box/completionContract'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  /** When true, the section collapses (parent owns identity + scale validity). */
  sectionDone?: boolean
}

function intFromInput(v: string): number | null {
  const t = v.trim()
  if (!t) return null
  if (!/^-?\d+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) ? n : null
}

/**
 * Setup mirrors concept: identity plus the result the brand buys. Dough owns
 * inventory overage, respondent-relative timing, and the hidden safety window.
 */
export default function SetupSection({
  draft,
  onChange,
  error,
  sectionDone = false,
}: Props) {
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)
  const inventory = ihutInventoryPlan(draft.targetCompletions)

  useEffect(() => {
    if (draft.taxonomyNodeId == null) {
      setNode(null)
      return
    }
    let cancelled = false
    void getTaxonomyNodeAction(draft.taxonomyNodeId).then((n) => {
      if (!cancelled) setNode(n)
    })
    return () => {
      cancelled = true
    }
  }, [draft.taxonomyNodeId])

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.setup}
      title="Setup"
      summary={summarizeBoxSetup(draft)}
      done={sectionDone}
    >
      <p style={helpStyle}>
        Name the study, pick the category, and choose the completed responses
        your report needs. Dough handles inventory and timing.
      </p>

      <div style={{ marginBottom: 24, maxWidth: 480 }}>
        <label htmlFor={BOX_ANCHORS.name} style={labelSm}>
          Study name
        </label>
        <input
          id={BOX_ANCHORS.name}
          className="cb-input"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="e.g. Gluten-free NYC discovery box"
          style={{ ...inputBase, width: '100%' }}
        />
      </div>

      <div id={BOX_ANCHORS.category} style={{ marginBottom: 28, maxWidth: 560 }}>
        <div style={labelSm}>Category</div>
        <CategoryCombobox
          selected={node}
          pendingNodeId={draft.taxonomyNodeId}
          required
          onSelect={(n) => {
            setNode(n)
            onChange({ ...draft, taxonomyNodeId: n.taxonomy_node_id })
          }}
          onClear={() => {
            setNode(null)
            onChange({ ...draft, taxonomyNodeId: null })
          }}
          error={error ?? null}
        />
      </div>

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
            <div className="box-completion-contract__eyebrow">Dough fielding plan</div>
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

      {error ? (
        <p role="alert" style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </BuilderSectionChrome>
  )
}

const helpStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink-50)',
  margin: '0 0 24px',
  lineHeight: 1.45,
  maxWidth: 640,
}

const runLede: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ink-80)',
  margin: 0,
}

const subHelp: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--ink-50)',
  margin: 0,
  lineHeight: 1.4,
}

const labelSm: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 8,
}

const inputBase: CSSProperties = {
  boxSizing: 'border-box',
  height: 48,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '0 16px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
}
