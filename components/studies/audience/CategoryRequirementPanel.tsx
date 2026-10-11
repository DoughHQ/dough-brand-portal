'use client'

import { categoryLevelLoopCopy } from '@/lib/studies/audience/categoryLevels'
import {
  BATTLE_INFO_BODY,
  BATTLE_INFO_TITLE,
} from '@/lib/studies/audience/copy'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'
import { BarInput } from './AudienceControls'
import CategoryCombobox from './CategoryCombobox'
import { labelSm, panel, subHelp } from './styles'
import type {
  AudienceEligibility,
  PatchAudienceEligibility,
} from './types'

type Props = {
  anchorId: string
  eligibility: AudienceEligibility
  studyTaxonomyNodeId: number | null
  qualifyingNode: TaxonomyNodeInfo | null
  setQualifyingNode: (node: TaxonomyNodeInfo | null) => void
  patch: PatchAudienceEligibility
  categoryOpen: boolean
  onCategoryOpenChange: (open: boolean) => void
  intro: string
  categoryHelp: string
  showMinTries: boolean
}

export default function CategoryRequirementPanel({
  anchorId,
  eligibility,
  studyTaxonomyNodeId,
  qualifyingNode,
  setQualifyingNode,
  patch,
  categoryOpen,
  onCategoryOpenChange,
  intro,
  categoryHelp,
  showMinTries,
}: Props) {
  function close() {
    setQualifyingNode(null)
    patch({
      qualifyingTaxonomyNodeId: null,
      qualifyingNodeLabel: null,
      minCategoryBattles: null,
      minCategoryTries: null,
      minCategoryLevel: null,
    })
    onCategoryOpenChange(false)
  }

  function openPanel() {
    onCategoryOpenChange(true)
    if (
      eligibility.qualifyingTaxonomyNodeId == null &&
      studyTaxonomyNodeId != null
    ) {
      patch({ qualifyingTaxonomyNodeId: studyTaxonomyNodeId })
    }
  }

  return (
    <div id={anchorId}>
      <div style={labelSm}>Category expertise</div>
      <p style={{ ...subHelp, marginBottom: 12, maxWidth: 620 }}>{intro}</p>

      {!categoryOpen && eligibility.qualifyingTaxonomyNodeId == null ? (
        <button
          type="button"
          className="cb-btn cb-btn-secondary"
          onClick={openPanel}
        >
          + Add a category requirement
        </button>
      ) : (
        <div style={panel}>
          <div style={{ marginBottom: 16 }}>
            <CategoryCombobox
              selected={qualifyingNode}
              pendingNodeId={
                qualifyingNode
                  ? null
                  : eligibility.qualifyingTaxonomyNodeId
              }
              required={false}
              onSelect={(node) => {
                setQualifyingNode(node)
                patch({
                  qualifyingTaxonomyNodeId: node.taxonomy_node_id,
                  qualifyingNodeLabel: node.node_name_display,
                })
              }}
              onClear={close}
              error={null}
            />
            <p style={{ ...subHelp, marginTop: 6 }}>{categoryHelp}</p>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <BarInput
              label="Min level"
              hint={categoryLevelLoopCopy(
                eligibility.minCategoryLevel,
                qualifyingNode?.node_name_display ??
                  eligibility.qualifyingNodeLabel
              )}
              value={eligibility.minCategoryLevel}
              onChange={(value) =>
                patch({
                  minCategoryLevel: value,
                  minCategoryTries: null,
                })
              }
              disabled={eligibility.qualifyingTaxonomyNodeId == null}
            />
            {showMinTries ? (
              <BarInput
                label="Min tries"
                hint="Completed product loops in this category. Leave blank for none."
                value={eligibility.minCategoryTries}
                onChange={(value) =>
                  patch({
                    minCategoryTries: value,
                    minCategoryLevel: null,
                  })
                }
                disabled={eligibility.qualifyingTaxonomyNodeId == null}
              />
            ) : null}
            <BarInput
              label="Min battles"
              hint="Leave blank for no engagement bar."
              value={eligibility.minCategoryBattles}
              onChange={(value) => patch({ minCategoryBattles: value })}
              disabled={eligibility.qualifyingTaxonomyNodeId == null}
              info={{
                title: BATTLE_INFO_TITLE,
                body: BATTLE_INFO_BODY,
                ariaLabel: 'What is a battle?',
              }}
            />
          </div>

          {eligibility.qualifyingTaxonomyNodeId == null ? (
            <button
              type="button"
              className="cb-quiet-action"
              onClick={() => onCategoryOpenChange(false)}
              style={{ marginTop: 16 }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
