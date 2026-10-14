import type { Dispatch, SetStateAction } from 'react'
import type { TaxonomySearchHit } from '@/lib/corrections.shared'

export const MIN_TAX_QUERY = 2

export function CategoryFields({
  draft,
  setDraft,
  taxQuery,
  setTaxQuery,
  taxHits,
  taxLoading,
  suggestedHit,
}: {
  draft: Record<string, unknown>
  setDraft: Dispatch<SetStateAction<Record<string, unknown>>>
  taxQuery: string
  setTaxQuery: (value: string) => void
  taxHits: TaxonomySearchHit[]
  taxLoading: boolean
  suggestedHit: TaxonomySearchHit | null
}) {
  return (
    <>
      <label className="corr-editor-label">
        Search categories
        <input
          className="corr-editor-input"
          value={taxQuery}
          onChange={(e) => setTaxQuery(e.target.value)}
          placeholder="Search by name or path…"
          autoFocus
        />
      </label>
      {draft.taxonomy_node_id != null && (
        <div className="corr-editor-selected corr-editor-selected-strong">
          Filing in {String(draft._label || draft.taxonomy_node_id)}
          {draft._path ? (
            <div className="corr-editor-hit-path">
              {String(draft._path).replace(/>/g, ' · ')}
            </div>
          ) : null}
        </div>
      )}
      {draft.taxonomy_node_id == null ? (
        <div className="corr-editor-hint">
          Pick a result. Nothing is filed until you do.
        </div>
      ) : null}
      {taxQuery.trim().length > 0 && taxQuery.trim().length < MIN_TAX_QUERY ? (
        <div className="corr-editor-hint">Type at least 2 characters.</div>
      ) : null}
      {taxLoading ? <div className="corr-editor-hint">Searching…</div> : null}
      {!taxLoading && taxQuery.trim().length >= MIN_TAX_QUERY && taxHits.length === 0 ? (
        <div className="corr-editor-hint">No matching categories.</div>
      ) : null}
      <div className="corr-editor-hits corr-editor-hits-scroll">
        {taxHits.map((n) => {
          const selected = Number(draft.taxonomy_node_id) === n.taxonomy_node_id
          const suggested = suggestedHit?.taxonomy_node_id === n.taxonomy_node_id
          return (
            <button
              key={n.taxonomy_node_id}
              type="button"
              className={selected ? 'corr-editor-hit is-on' : 'corr-editor-hit'}
              onClick={() => {
                setDraft({
                  taxonomy_node_id: n.taxonomy_node_id,
                  _label: n.node_name_display,
                  _path: n.path_names_csv,
                })
              }}
            >
              <div>
                {n.node_name_display}
                {suggested && !selected ? (
                  <span className="corr-editor-suggest">Suggested</span>
                ) : null}
              </div>
              <div className="corr-editor-hit-path">
                {(n.path_names_csv ?? '').replace(/>/g, ' · ')}
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
