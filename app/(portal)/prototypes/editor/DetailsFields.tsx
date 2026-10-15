import CategoryCombobox from '@/components/studies/audience/CategoryCombobox'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import type { PrototypeEditorState } from './usePrototypeEditor'

export function DetailsFields({
  initial,
  pending,
  name,
  setName,
  internalLabel,
  setInternalLabel,
  node,
  setNode,
  taxonomyNodeId,
  setTaxonomyNodeId,
  packaging,
  setPackaging,
  price,
  setPrice,
}: { initial: PrototypeListItem | null } & Pick<
  PrototypeEditorState,
  | 'pending'
  | 'name'
  | 'setName'
  | 'internalLabel'
  | 'setInternalLabel'
  | 'node'
  | 'setNode'
  | 'taxonomyNodeId'
  | 'setTaxonomyNodeId'
  | 'packaging'
  | 'setPackaging'
  | 'price'
  | 'setPrice'
>) {
  return (
    <>
        <label className="proto-field">
          <span className="proto-field-label">Name shown to respondents</span>
          <input
            className="proto-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Honey sesame chips"
            maxLength={120}
            disabled={pending}
            autoFocus={!initial}
          />
        </label>

        <label className="proto-field">
          <span className="proto-field-label">Internal label · never shown</span>
          <input
            className="proto-input"
            value={internalLabel}
            onChange={(e) => setInternalLabel(e.target.value)}
            placeholder="e.g. v3 formula · blue bag"
            maxLength={120}
            disabled={pending}
          />
        </label>

        <div className="proto-field">
          <span className="proto-field-label">Category</span>
          <CategoryCombobox
            selected={node}
            pendingNodeId={node ? null : taxonomyNodeId}
            required
            onSelect={(n) => {
              setNode(n)
              setTaxonomyNodeId(n.taxonomy_node_id)
            }}
            onClear={() => {
              setNode(null)
              setTaxonomyNodeId(null)
            }}
          />
        </div>

        <div className="proto-field">
          <span className="proto-field-label">Packaging</span>
          <div className="proto-seg">
            <button
              type="button"
              className={`proto-seg-btn${packaging === 'plain_sample' ? ' proto-seg-on' : ''}`}
              disabled={pending}
              onClick={() => setPackaging('plain_sample')}
            >
              Plain sample
            </button>
            <button
              type="button"
              className={`proto-seg-btn${packaging === 'final_packaging' ? ' proto-seg-on' : ''}`}
              disabled={pending}
              onClick={() => setPackaging('final_packaging')}
            >
              Final packaging
            </button>
          </div>
          <p className="proto-help-tight">
            {packaging === 'plain_sample'
              ? 'Taste-only studies. Shown as Sample A / B to respondents.'
              : 'Shopper-facing pack. Enables shelf, opening, and expectation questions.'}
          </p>
        </div>

        <label className="proto-field">
          <span className="proto-field-label">Planned shelf price · optional</span>
          <input
            className="proto-input"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="4.99"
            disabled={pending}
          />
        </label>
    </>
  )
}
