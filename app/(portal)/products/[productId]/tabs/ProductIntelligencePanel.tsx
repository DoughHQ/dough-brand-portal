'use client'

import type { ReactNode } from 'react'
import type { MasterIntelligence } from '@/lib/productMaster/types'
import {
  battleWinFillPct,
  jobStatusCopy,
  rankStandingFillPct,
  raterFloorProgress,
  type HeadToHeadJob,
  type HeadlineStanding,
  type IntelligenceVolumeStat,
} from './intelligencePresentation'

function Meter({
  pct,
  tone = 'sage',
  label,
}: {
  pct: number
  tone?: 'sage' | 'amber' | 'ink'
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div
      className={`pm-intel-meter pm-intel-meter--${tone}`}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="pm-intel-meter-fill" style={{ width: `${clamped}%` }} />
    </div>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="pm-intel-chip">{children}</span>
}

export default function ProductIntelligencePanel({
  headline,
  volume,
  floorCopy,
  jobs,
  showJobScores,
  intelligence,
}: {
  headline: HeadlineStanding | null
  volume: IntelligenceVolumeStat[]
  floorCopy: string | null
  jobs: HeadToHeadJob[]
  showJobScores: boolean
  intelligence: MasterIntelligence | null
}) {
  const floor = intelligence ? raterFloorProgress(intelligence) : null
  const heroFill = headline
    ? rankStandingFillPct(headline.rankValue, headline.poolValue)
    : null
  const heroWin = headline
    ? battleWinFillPct(headline.battlesWon, headline.battlesTotal)
    : null
  const adminOnly = Boolean(intelligence?.admin_only)

  return (
    <div className="pm-intel-panel">
      <header className="pm-intel-header">
        <h2 className="pm-intel-title">Intelligence</h2>
        <p className="pm-intel-sub">
          How this product stands in Dough head-to-heads — the jobs shoppers actually vote on.
        </p>
      </header>

      {headline ? (
        <section className="pm-intel-hero portal-panel">
          <div className="pm-intel-hero-top">
            <div className="pm-intel-hero-copy">
              <p className="pm-intel-eyebrow">Standing</p>
              <p className="pm-intel-hero-rank">{headline.rankLabel}</p>
              <p className="pm-intel-hero-q">&ldquo;{headline.question}&rdquo;</p>
            </div>
            {heroFill != null ? (
              <div className="pm-intel-hero-gauge">
                <p className="pm-intel-hero-gauge-value">{heroFill}%</p>
                <p className="pm-intel-hero-gauge-label">toward top of set</p>
                <Meter pct={heroFill} label="Standing in compare set" />
              </div>
            ) : null}
          </div>

          <div className="pm-intel-hero-meta">
            {headline.eloLabel ? <Chip>Elo {headline.eloLabel}</Chip> : null}
            {headline.recordLabel ? <Chip>{headline.recordLabel}</Chip> : null}
            {headline.setName ? <Chip>{headline.setName}</Chip> : null}
            {heroWin != null ? <Chip>{heroWin}% win rate</Chip> : null}
          </div>

          <p className="pm-intel-hero-note pm-intel-hero-note--warn">
            Unpublished ranking. Organic Elo has no confidence interval.
          </p>
        </section>
      ) : null}

      {volume.length > 0 ? (
        <section className="pm-intel-volume" aria-label="Volume">
          <dl className="pm-intel-stats">
            {volume.map((stat) => {
              const isRaters = stat.key === 'raters'
              const isDraft = stat.key === 'taste' || stat.key === 'health'
              return (
                <div
                  key={stat.key}
                  className={`pm-intel-stat portal-panel${isDraft ? ' pm-intel-stat--draft' : ''}`}
                >
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                  {isRaters && floor ? (
                    <>
                      <Meter
                        pct={floor.pct}
                        tone={floor.pct >= 100 ? 'sage' : 'amber'}
                        label="Raters toward publishable score"
                      />
                      <p className="pm-intel-stat-sub">
                        {floor.have.toLocaleString()} of {floor.need.toLocaleString()} to publish
                      </p>
                    </>
                  ) : null}
                  {isDraft ? <p className="pm-intel-stat-sub">Draft · not published</p> : null}
                </div>
              )
            })}
          </dl>
          {floorCopy && !floor ? <p className="pm-intel-floor">{floorCopy}</p> : null}
        </section>
      ) : null}

      {jobs.length === 0 ? (
        <div className="pm-intel-empty portal-panel">
          <h3>No comparison jobs on file</h3>
          <p>
            This product isn’t in a Dough head-to-head yet. Jobs appear once the category has an
            active compare group.
          </p>
        </div>
      ) : (
        <section className="pm-intel-jobs-block">
          <div className="pm-intel-section-row">
            <h3 className="pm-intel-section">Head-to-heads</h3>
            {showJobScores ? (
              <p className="pm-intel-section-note">Scores unpublished · no confidence interval</p>
            ) : null}
          </div>
          <div className="pm-intel-jobs">
            {jobs.map((job) => {
              const title = job.question ?? job.setName ?? 'Comparison job'
              const quoted = Boolean(job.question)
              const status = jobStatusCopy(job, showJobScores)
              return (
                <article key={job.compareGroupId} className="pm-intel-job portal-panel">
                  <div className="pm-intel-job-head">
                    {job.battleLevelLabel ? (
                      <span className="pm-intel-level">{job.battleLevelLabel}</span>
                    ) : null}
                    <div className="pm-intel-job-titles">
                      <h3 className="pm-intel-job-q">
                        {quoted ? <>&ldquo;{title}&rdquo;</> : title}
                      </h3>
                      {job.setName && job.question ? (
                        <p className="pm-intel-job-set">{job.setName}</p>
                      ) : null}
                    </div>
                  </div>

                  {job.standings.map((standing) => {
                    const fill = rankStandingFillPct(standing.rankValue, standing.poolValue)
                    const win = battleWinFillPct(standing.battlesWon, standing.battlesTotal)
                    return (
                      <div key={standing.key} className="pm-intel-standing">
                        <div className="pm-intel-standing-row">
                          {standing.rankLabel ? (
                            <div className="pm-intel-standing-cell">
                              <span className="pm-intel-standing-label">Rank</span>
                              <span className="pm-intel-standing-value">{standing.rankLabel}</span>
                              {fill != null ? (
                                <Meter pct={fill} label={`Standing ${standing.rankLabel}`} />
                              ) : null}
                            </div>
                          ) : standing.rankComparable === false ? (
                            <div className="pm-intel-standing-cell">
                              <span className="pm-intel-standing-label">Rank</span>
                              <span className="pm-intel-standing-value pm-intel-standing-value--muted">
                                Not comparable yet
                              </span>
                            </div>
                          ) : null}
                          {standing.eloLabel ? (
                            <div className="pm-intel-standing-cell">
                              <span className="pm-intel-standing-label">Elo</span>
                              <span className="pm-intel-standing-value">{standing.eloLabel}</span>
                            </div>
                          ) : null}
                          {standing.recordLabel ? (
                            <div className="pm-intel-standing-cell">
                              <span className="pm-intel-standing-label">Record</span>
                              <span className="pm-intel-standing-value">{standing.recordLabel}</span>
                              {win != null ? (
                                <Meter pct={win} tone="ink" label="Win rate" />
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        {standing.maturityLabel || standing.seedSource ? (
                          <p className="pm-intel-hero-note">
                            {[
                              standing.maturityLabel,
                              standing.seedSource ? `Seeded from ${standing.seedSource}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}

                  {status ? <p className="pm-intel-status">{status}</p> : null}
                </article>
              )
            })}
          </div>
        </section>
      )}

      {!showJobScores && jobs.length > 0 ? (
        <p className="pm-intel-note">
          Published Elo and rankings aren’t shown here. Organic scores have no confidence interval.
        </p>
      ) : adminOnly && showJobScores ? (
        <p className="pm-intel-note">
          Admin view. These scores are unpublished and must not be presented as a brand-facing
          ranking.
        </p>
      ) : null}
    </div>
  )
}
