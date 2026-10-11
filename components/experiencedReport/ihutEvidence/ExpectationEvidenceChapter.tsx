import type { IhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import { DataGapNotice } from '../DecisionChapters'
import { pct } from './format'
import { ShareTable } from './ShareTable'

export function ExpectationEvidenceChapter({
  report,
  productRef,
  number = '07',
}: {
  report: IhutCoreReport
  productRef: number
  number?: string
}) {
  const rows = report.expectation_vs_experience ?? []
  const hero = rows.find((r) => r.ref === productRef)
  const title = hero?.liked_and_expected_good_share != null
    ? `${pct(hero.liked_and_expected_good_share)} liked it and expected it to be good.`
    : 'Expectation versus experience.'

  return (
    <StoryChapter
      id="expectation"
      number={number}
      kicker="Evidence · Expectation"
      title={title}
      lead="Share who both liked the product and said their expectation was met. Gaps here flag promise–delivery risk."
      context={`${rows.length} product${rows.length === 1 ? '' : 's'}`}
    >
      {rows.length ? (
        <ShareTable
          rows={rows}
          heroRef={productRef}
          valueKey="liked_and_expected_good_share"
          valueLabel="Liked + expected good"
        />
      ) : (
        <DataGapNotice
          title="Expectation gap not in this freeze"
          body="No expectation-versus-experience shares are available."
        />
      )}
    </StoryChapter>
  )
}
