import type { Dispatch, SetStateAction } from 'react'

export function BrandFields({
  draft,
  setDraft,
  brandQuery,
  setBrandQuery,
  brandHits,
}: {
  draft: Record<string, unknown>
  setDraft: Dispatch<SetStateAction<Record<string, unknown>>>
  brandQuery: string
  setBrandQuery: (value: string) => void
  brandHits: Array<{ brand_id: number; brand_name: string }>
}) {
  return (
    <>
      <label className="corr-editor-label">
        Search existing brands
        <input
          className="corr-editor-input"
          value={brandQuery}
          onChange={(e) => setBrandQuery(e.target.value)}
          placeholder="Type to search — brands are never auto-created"
        />
      </label>
      {draft.brand_id != null && (
        <div className="corr-editor-selected">
          Selected: {String(draft.brand_name)} (#{String(draft.brand_id)})
        </div>
      )}
      <div className="corr-editor-hits">
        {brandHits.map((b) => (
          <button
            key={b.brand_id}
            type="button"
            className="corr-editor-hit"
            onClick={() => {
              setDraft((d) => ({ ...d, brand_id: b.brand_id, brand_name: b.brand_name }))
              setBrandQuery(b.brand_name)
            }}
          >
            {b.brand_name}
          </button>
        ))}
      </div>
    </>
  )
}
