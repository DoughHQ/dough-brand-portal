'use client'

import type { PlanetDemandCopy } from '@/lib/transparency/proofAskCounts'

export default function PlanetDemand({ copy }: { copy: PlanetDemandCopy }) {
  return (
    <aside
      className={`tx-demand tx-demand--${copy.tone}`}
      aria-live="polite"
      data-testid="planet-demand"
    >
      <p className="tx-demand__kicker">{copy.kicker}</p>
      <p className="tx-demand__count">
        <span className="tx-demand__num">{copy.count.toLocaleString()}</span>
        <span className="tx-demand__noun">{copy.countNoun}</span>
      </p>
      {copy.shopperSees ? (
        <div className="tx-demand__sees">
          <p className="tx-demand__sees-kicker">They see this today</p>
          <p className="tx-demand__sees-line">{copy.shopperSees}</p>
        </div>
      ) : null}
      {copy.catalogLine ? (
        <p className="tx-demand__catalog">{copy.catalogLine}</p>
      ) : null}
      {copy.recencyLine ? (
        <p className="tx-demand__recency">{copy.recencyLine}</p>
      ) : null}
      <p className="tx-demand__close">{copy.closeLine}</p>
    </aside>
  )
}
