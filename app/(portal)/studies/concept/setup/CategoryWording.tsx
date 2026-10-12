import type { ConceptStudyDraft } from '@/lib/concept/types'
import { templateFieldAnchor } from '@/lib/concept/templateConfig'
import { categoryPluralFromNodeName } from '@/lib/concept/taxonomySiblings'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'
import CategoryCombobox from '@/components/studies/audience/CategoryCombobox'
import { inputBase, labelSm } from '../conceptStyles'

export default function CategoryWording({
  draft,
  node,
  hasCategory,
  wordingOpen,
  setWordingOpen,
  wording,
  setWording,
  isDefaultWording,
  onSelect,
  onClear,
  error,
}: {
  draft: ConceptStudyDraft
  node: TaxonomyNodeInfo | null
  hasCategory: boolean
  wordingOpen: boolean
  setWordingOpen: (open: boolean) => void
  wording: string
  setWording: (value: string) => void
  isDefaultWording: boolean
  onSelect: (node: TaxonomyNodeInfo) => void
  onClear: () => void
  error?: string | null
}) {
  return (
    <div className="cb-setup-category">
      <CategoryCombobox
        selected={node}
        pendingNodeId={hasCategory && !node ? draft.taxonomyNodeId : null}
        required={!hasCategory}
        onSelect={onSelect}
        onClear={onClear}
        error={error}
      />

      {hasCategory ? (
        // The template anchor lives on a wrapper that exists whenever a category
        // does. It used to sit on the wording editor, which meant the sticky
        // footer's "Category phrasing is empty" blocker resolved to nothing while
        // the editor was collapsed — a dead anchor.
        <div id={templateFieldAnchor('category_plural')}>
          {wordingOpen ? (
            <div className="cb-wording-editor">
              <label style={labelSm} htmlFor="category_plural_s0">
                Questionnaire wording
              </label>
              <input
                id="category_plural_s0"
                className="cb-input"
                value={wording}
                onChange={(e) => setWording(e.target.value)}
                onBlur={() => {
                  if (!wording.trim() && node) {
                    setWording(categoryPluralFromNodeName(node.node_name_display))
                  }
                }}
                placeholder={node ? categoryPluralFromNodeName(node.node_name_display) : 'licorice'}
                style={{ ...inputBase, maxWidth: 360 }}
              />
              <p className="cb-field-note">
                Used where a respondent question needs the category name in a sentence.
              </p>
              <div className="cb-wording-actions">
                <button type="button" className="cb-quiet-action" onClick={() => setWordingOpen(false)}>
                  Close
                </button>
                {!isDefaultWording && node ? (
                  <button
                    type="button"
                    className="cb-quiet-action"
                    onClick={() => setWording(categoryPluralFromNodeName(node.node_name_display))}
                  >
                    Use default
                  </button>
                ) : null}
              </div>
            </div>
          ) : isDefaultWording ? (
            <button
              type="button"
              className="cb-wording-trigger cb-quiet-action"
              onClick={() => setWordingOpen(true)}
            >
              Edit questionnaire wording
            </button>
          ) : (
            <p className="cb-wording-summary">
              <span>
                Questionnaire wording: <strong>{wording}</strong>
              </span>
              <button type="button" className="cb-quiet-action" onClick={() => setWordingOpen(true)}>
                Edit
              </button>
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
