import type { IhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import { DataGapNotice } from '../DecisionChapters'
import ev from '../ihutEvidence.module.css'
import { pct } from './format'
import { ShareTable } from './ShareTable'

export function BuyOrderEvidenceChapter({
  report,
  productRef,
  number = '06',
}: {
  report: IhutCoreReport
  productRef: number
  number?: string
}) {
  const rows = report.buy_order ?? []
  const hero = rows.find((r) => r.ref === productRef)
  const title = hero?.first_share != null
    ? `${pct(hero.first_share)} ranked your product first after tasting.`
    : 'Preference order after tasting.'

  return (
    <StoryChapter
      id="buy-order"
      number={number}
      kicker="Evidence · Buy order"
      title={title}
      lead="Share ranked first after tasting, plus average rank where available. Preference order is not buy-at-price intent."
      context={`${rows.length} product${rows.length === 1 ? '' : 's'}`}
    >
      {rows.length ? (
        <>
          <ShareTable
            rows={rows}
            heroRef={productRef}
            valueKey="first_share"
            valueLabel="Ranked first"
          />
          <div className={ev.measureBlock}>
            <div className={ev.measureHead}>
              <h4 className={ev.measureTitle}>Average rank</h4>
              <p className={ev.measureNote}>Lower is better · after tasting</p>
            </div>
            <div className={ev.tableWrap}>
              <table className={ev.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Avg rank</th>
                    <th>n</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows]
                    .sort(
                      (a, b) =>
                        (a.avg_rank ?? 99) - (b.avg_rank ?? 99),
                    )
                    .map((row) => {
                      const yours = row.ref === productRef
                      return (
                        <tr
                          key={row.ref}
                          className={yours ? ev.yours : undefined}
                        >
                          <td>
                            {row.name}
                            {yours ? (
                              <span className={ev.yoursMark}>Yours</span>
                            ) : null}
                          </td>
                          <td className={ev.num}>
                            {row.avg_rank != null
                              ? row.avg_rank.toFixed(2)
                              : '—'}
                          </td>
                          <td className={ev.num}>{row.n}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <DataGapNotice
          title="Buy order not in this freeze"
          body="No first-share or average-rank rows are available."
        />
      )}
    </StoryChapter>
  )
}
