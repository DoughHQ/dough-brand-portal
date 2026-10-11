import type { IhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import { WhyBank } from './CountBanks'

export function WhyEvidenceChapter({
  report,
  number = '05',
}: {
  report: IhutCoreReport
  number?: string
}) {
  const rows = report.taste_why ?? []
  const top = [...rows].sort((a, b) => b.n - a.n)[0]
  const title = top
    ? `“${top.answer}” led the coded taste reasons (${top.n} mentions).`
    : 'Coded taste reasons from the freeze.'

  return (
    <StoryChapter
      id="why"
      number={number}
      kicker="Evidence · Why"
      title={title}
      lead="Full coded bank of taste-choice reasons — counts and share of mentions. Themes explain preference; they do not prove causality."
      context={`${rows.length} theme${rows.length === 1 ? '' : 's'}`}
    >
      <WhyBank rows={rows} />
    </StoryChapter>
  )
}
