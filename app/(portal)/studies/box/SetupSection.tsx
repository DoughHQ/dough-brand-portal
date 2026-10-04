'use client'

import { useEffect, useState } from 'react'
import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS, type BoxPublishFailure } from '@/lib/box/validity'
import { summarizeBoxSetup } from '@/lib/box/builderSummaries'
import {
  getTaxonomyNodeAction,
  type TaxonomyNodeInfo,
} from '../concept/actions'
import CategoryCombobox from '../concept/CategoryCombobox'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  /** When true, the section collapses (parent owns validity.setupOk). */
  sectionDone?: boolean
}

/**
 * Setup is name + category only. Seats (your product, prototype, competitors)
 * live in Build the field — same split as the concept builder.
 */
export default function SetupSection({
  draft,
  onChange,
  error,
  sectionDone = false,
}: Props) {
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)

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
        Name the study and pick the decision category. Then build who ships in the box
        below — your catalog product, a prototype, and competitors.
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
          style={inputBase}
        />
      </div>

      <div id={BOX_ANCHORS.category} style={{ marginBottom: 8, maxWidth: 560 }}>
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
    </BuilderSectionChrome>
  )
}

const helpStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink-50)',
  margin: '0 0 24px',
  lineHeight: 1.45,
  maxWidth: 640,
}
const labelSm = {
  display: 'block' as const,
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 8,
}
const inputBase = {
  width: '100%',
  boxSizing: 'border-box' as const,
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
