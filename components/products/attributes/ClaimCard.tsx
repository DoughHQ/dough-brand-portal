import {
  facetValueLabel,
  provenanceLabelFromSource,
  reviewStateLabel,
  type DeclarableFacetRow,
  type FacetDeclaredValue,
} from '@/lib/facets/productFacets'
import { FacetChipAdd, FacetSearchSelect } from '@/components/products/FacetValuePicker'
import { FacetGlyph } from '@/components/products/facetGlyphs'
import { useClaimCard } from './useClaimCard'

export function ClaimCard({
  row,
  productId,
  canEdit,
  busyKey,
  setBusyKey,
  setError,
  onWrote,
  bare = false,
}: {
  row: DeclarableFacetRow
  productId: number
  canEdit: boolean
  busyKey: string | null
  setBusyKey: (k: string | null) => void
  setError: (e: string | null) => void
  onWrote: () => Promise<void>
  bare?: boolean
}) {
  const {
    derived,
    live,
    pending,
    available,
    multi,
    requiresEvidence,
    showPicker,
    taken,
    derivedSet,
    draftSingle,
    setDraftSingle,
    pendingAdd,
    setPendingAdd,
    evidenceUrl,
    setEvidenceUrl,
    evidenceNote,
    setEvidenceNote,
    onWithdraw,
    declareValues,
    saveSingle,
    singleDirty,
  } = useClaimCard({ row, productId, canEdit, setBusyKey, setError, onWrote })

  const renderDeclaredChip = (d: FacetDeclaredValue, pendingChip: boolean) => {
    const label = facetValueLabel(row, d.value, d.label)
    const state = reviewStateLabel(d.review_state)
    return (
      <span
        key={`${pendingChip ? 'p' : 'c'}-${d.declaration_id}`}
        className={`pf-chip${pendingChip ? ' pf-chip--pending' : ' pf-chip--declared'}`}
      >
        {label}
        {state ? <span className="pf-chip__meta">{state}</span> : null}
        {showPicker ? (
          <button
            type="button"
            className="pf-chip__x"
            aria-label={`${pendingChip ? 'Withdraw pending' : 'Remove'} ${label}`}
            disabled={busyKey != null}
            onClick={() => void onWithdraw(d.declaration_id)}
          >
            ×
          </button>
        ) : null}
      </span>
    )
  }

  const body = (
    <>
      {(derived.length > 0 || live.length > 0 || pending.length > 0) && (
        <div className="pf-chip-row" aria-label="Current values">
          {derived.map((d) => (
            <span
              key={`d-${d.value}`}
              className="pf-chip pf-chip--derived"
              title={provenanceLabelFromSource(d.source)}
            >
              {facetValueLabel(row, d.value, d.label)}
              <span className="pf-chip__meta">{provenanceLabelFromSource(d.source)}</span>
            </span>
          ))}
          {live.map((d) => renderDeclaredChip(d, false))}
          {pending.map((d) => renderDeclaredChip(d, true))}
        </div>
      )}

      {showPicker && available.length > 0 ? (
        <div className="pf-claim__editor">
          {multi ? (
            <FacetChipAdd
              options={available}
              takenValues={taken}
              lockedValues={derivedSet}
              disabled={busyKey != null}
              placeholder={`Add ${row.display_name.toLowerCase()}…`}
              onAdd={(value) => {
                if (requiresEvidence) {
                  setPendingAdd(value)
                } else {
                  void declareValues([value])
                }
              }}
            />
          ) : (
            <FacetSearchSelect
              options={available}
              value={draftSingle}
              lockedValues={derivedSet}
              disabled={busyKey != null}
              placeholder={`Search ${row.display_name.toLowerCase()}…`}
              onChange={setDraftSingle}
            />
          )}

          {(requiresEvidence && (pendingAdd || (singleDirty && draftSingle))) ||
          (!multi && singleDirty) ? (
            <>
              {requiresEvidence && (pendingAdd || (singleDirty && draftSingle)) ? (
                <div className="pf-evidence">
                  <label>
                    Evidence URL
                    <input
                      type="url"
                      placeholder="https://"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      disabled={busyKey != null}
                    />
                  </label>
                  <label>
                    Note (optional)
                    <textarea
                      rows={2}
                      value={evidenceNote}
                      onChange={(e) => setEvidenceNote(e.target.value)}
                      disabled={busyKey != null}
                    />
                  </label>
                </div>
              ) : null}
              <div className="pf-actions">
                <button
                  type="button"
                  className="pf-btn"
                  disabled={
                    busyKey != null ||
                    (requiresEvidence && !evidenceUrl.trim()) ||
                    (multi ? !pendingAdd : !singleDirty)
                  }
                  onClick={() => {
                    if (multi && pendingAdd) void declareValues([pendingAdd])
                    else void saveSingle()
                  }}
                >
                  {busyKey?.startsWith(`${row.facet_type}:`)
                    ? 'Saving…'
                    : requiresEvidence
                      ? 'Submit for review'
                      : 'Save'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )

  if (bare) return <div className="pf-claim pf-claim--bare">{body}</div>

  return (
    <article className="pf-claim">
      <div className="pf-claim__head">
        <div className="pf-claim__title-row">
          <span className="pf-claim__icon" aria-hidden>
            <FacetGlyph type={row.facet_type} size={16} />
          </span>
          <h4 className="pf-claim__title">{row.display_name}</h4>
        </div>
        {requiresEvidence ? <span className="pf-claim__badge">Evidence</span> : null}
      </div>
      {body}
    </article>
  )
}
