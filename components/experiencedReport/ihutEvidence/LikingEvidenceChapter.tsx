import type { IhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import { DataGapNotice } from '../DecisionChapters'
import { pct } from './format'
import { ShareTable } from './ShareTable'

export function LikingEvidenceChapter({
  report,
  productRef,
  number = '03',
}: {
  report: IhutCoreReport
  productRef: number
  number?: string
}) {
  const rows = report.liking ?? []
  const hero = rows.find((r) => r.ref === productRef)
  const title = hero?.top_two_share != null
    ? `${pct(hero.top_two_share)} top-two liking for your product.`
    : 'Liking across the tested field.'

  return (
    <StoryChapter
      id="liking"
      number={number}
      kicker="Evidence · Liking"
      title={title}
      lead="Top-two-box liking for every product in the freeze. Compare the field — do not average unlike seats."
      context={`${rows.length} product${rows.length === 1 ? '' : 's'}`}
    >
      {rows.length ? (
        <ShareTable
          rows={rows}
          heroRef={productRef}
          valueKey="top_two_share"
          valueLabel="Top-two liking"
        />
      ) : (
        <DataGapNotice
          title="Liking not in this freeze"
          body="No liking shares are available to page."
        />
      )}
    </StoryChapter>
  )
}
