import type { IhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import story from '@/components/reportStory/reportStory.module.css'
import { DataGapNotice } from '../DecisionChapters'
import ev from '../ihutEvidence.module.css'
import { movementFor, RankList } from './rankEvidence'

export function FieldEvidenceChapter({
  report,
  productName,
  productRef,
  positionTitle,
  positionLead,
  number = '02',
}: {
  report: IhutCoreReport
  productName: string
  productRef: number
  positionTitle: string
  positionLead: string
  number?: string
}) {
  const shelfRows = report.promise_vs_delivery?.shelf ?? []
  const tasteRows = report.promise_vs_delivery?.taste ?? []
  const mapRows = report.promise_vs_delivery?.map ?? []
  const allRefs = new Set([
    ...shelfRows.map((r) => r.ref),
    ...tasteRows.map((r) => r.ref),
  ])

  return (
    <StoryChapter
      id="field"
      number={number}
      kicker="Evidence · Shelf → taste"
      title={positionTitle}
      lead={positionLead}
      context={`${allRefs.size} product${allRefs.size === 1 ? '' : 's'} in field`}
    >
      {shelfRows.length || tasteRows.length ? (
        <>
          <div className={ev.splitGrid}>
            <article className={ev.panel}>
              <p className={ev.panelEyebrow}>Before tasting</p>
              <h3 className={ev.panelTitle}>Shelf promise</h3>
              <RankList rows={shelfRows} heroRef={productRef} />
            </article>
            <article className={ev.panel}>
              <p className={ev.panelEyebrow}>After tasting</p>
              <h3 className={ev.panelTitle}>Delivered experience</h3>
              <RankList rows={tasteRows} heroRef={productRef} />
            </article>
          </div>

          {allRefs.size > 0 ? (
            <div className={ev.measureBlock}>
              <div className={ev.measureHead}>
                <h4 className={ev.measureTitle}>Movement by product</h4>
                <p className={ev.measureNote}>
                  Rank change from shelf promise to tasted experience for{' '}
                  {productName} and the field.
                </p>
              </div>
              <div className={ev.tableWrap}>
                <table className={ev.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Shelf</th>
                      <th>Taste</th>
                      <th>Movement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...allRefs].map((ref) => {
                      const shelf = shelfRows.find((r) => r.ref === ref)
                      const taste = tasteRows.find((r) => r.ref === ref)
                      const name = shelf?.name ?? taste?.name ?? `Product ${ref}`
                      const yours = ref === productRef
                      const move = movementFor(shelf, taste)
                      return (
                        <tr key={ref} className={yours ? ev.yours : undefined}>
                          <td>
                            {name}
                            {yours ? (
                              <span className={ev.yoursMark}>Yours</span>
                            ) : null}
                          </td>
                          <td className={ev.num}>
                            {shelf?.rank != null ? `#${shelf.rank}` : '—'}
                          </td>
                          <td className={ev.num}>
                            {taste?.rank != null ? `#${taste.rank}` : '—'}
                          </td>
                          <td>
                            {move ? (
                              <span
                                className={`${ev.movementBadge} ${
                                  move.kind === 'up'
                                    ? ev.movedUp
                                    : move.kind === 'down'
                                      ? ev.movedDown
                                      : ev.held
                                }`}
                              >
                                {move.label}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {mapRows.length ? (
            <p className={story.finePrint}>
              {report.promise_vs_delivery?.note ??
                'Underlying Bradley–Terry strengths are model scores, not percentages.'}
            </p>
          ) : (
            <p className={story.finePrint}>
              Rank is shown because it is decision-readable. Underlying
              Bradley–Terry strengths are model scores, not percentages.
            </p>
          )}
        </>
      ) : (
        <DataGapNotice
          title="No promise-to-delivery comparison yet"
          body="Both shelf and tasted positions are required before this report claims movement."
        />
      )}
    </StoryChapter>
  )
}
