import type { IhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import story from '@/components/reportStory/reportStory.module.css'
import { DataGapNotice } from '../DecisionChapters'
import ev from '../ihutEvidence.module.css'
import { CountBank } from './CountBanks'
import { pct } from './format'

export function Day2EvidenceChapter({
  report,
  number = '09',
}: {
  report: IhutCoreReport
  number?: string
}) {
  const day2 = report.day2
  const available =
    day2.preference_hold.n > 0 ||
    day2.consumption.length > 0 ||
    day2.wear.length > 0
  const title =
    day2.preference_hold.n > 0
      ? `${pct(day2.preference_hold.same_favorite_share)} kept the same favorite on Day 2.`
      : 'Day 2 evidence is not available yet.'

  return (
    <StoryChapter
      id="durability"
      number={number}
      kicker="Evidence · Day 2"
      title={title}
      lead={
        available
          ? 'Follow-up hold, consumption, and wear. Observational — not causal proof that Day 1 drove Day 2.'
          : 'This section stays visible so a missing follow-up is explicit, not silently omitted.'
      }
      context="Follow-up evidence"
    >
      {available ? (
        <>
          <div className={ev.statStrip}>
            <article className={ev.statCard}>
              <p className={ev.statValue}>
                {pct(day2.preference_hold.same_favorite_share)}
              </p>
              <p className={ev.statLabel}>
                Same Day 1 favorite · n={day2.preference_hold.n}
              </p>
            </article>
            <article className={ev.statCard}>
              <p className={ev.statValue}>{day2.consumption.length}</p>
              <p className={ev.statLabel}>Consumption response buckets</p>
            </article>
            <article className={ev.statCard}>
              <p className={ev.statValue}>{day2.wear.length}</p>
              <p className={ev.statLabel}>Wear / familiarity buckets</p>
            </article>
          </div>

          <div className={ev.splitGrid} style={{ marginTop: 18 }}>
            <article className={ev.panel}>
              <p className={ev.panelEyebrow}>Consumption</p>
              <h3 className={ev.panelTitle}>How much was used</h3>
              {day2.consumption.length ? (
                <CountBank rows={day2.consumption} />
              ) : (
                <p className={story.cardText}>Not reported.</p>
              )}
            </article>
            <article className={ev.panel}>
              <p className={ev.panelEyebrow}>Wear</p>
              <h3 className={ev.panelTitle}>How the experience held</h3>
              {day2.wear.length ? (
                <CountBank rows={day2.wear} />
              ) : (
                <p className={story.cardText}>Not reported.</p>
              )}
            </article>
          </div>
        </>
      ) : (
        <DataGapNotice
          title="No Day 2 response is included"
          body="No hold, consumption, or wear claim is made from the Day 1 result."
        />
      )}
    </StoryChapter>
  )
}
