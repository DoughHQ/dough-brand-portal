import CategoryCombobox from '@/components/studies/audience/CategoryCombobox'
import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS } from '@/lib/box/validity'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'
import { labelSm } from './setupStyles'

export default function BoxCategoryField({
  draft,
  node,
  setNode,
  onChange,
  error,
}: {
  draft: BoxStudyDraft
  node: TaxonomyNodeInfo | null
  setNode: (node: TaxonomyNodeInfo | null) => void
  onChange: (next: BoxStudyDraft) => void
  error?: string | null
}) {
  return (
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
  )
}
