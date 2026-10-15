import type { StudioChaptersState } from './useStudioChapters'

export default function StudioHeader({ totals }: Pick<StudioChaptersState, 'totals'>) {
  return (
    <header className="tx-studio__header">
      <p className="tx-studio__eyebrow">P.R.O.O.F. · Product transparency</p>
      <div className="tx-studio__title-row">
        <h2 className="tx-studio__title">Disclosures</h2>
        <div className="tx-studio__stats">
          <span>
            <strong>{totals.published}</strong> published
          </span>
          <span>
            <strong>{totals.privateN}</strong> private
          </span>
          <span>
            <strong>{totals.untouched}</strong> not started
          </span>
        </div>
      </div>
      <p className="tx-studio__lede">
        Five chapters. Disclose what you know, with provenance. Unpublished stays private —
        publishing is what shoppers see.
      </p>
    </header>
  )
}
