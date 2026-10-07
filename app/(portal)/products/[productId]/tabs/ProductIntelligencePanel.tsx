'use client'

import type { ReactNode } from 'react'
import type { MasterIntelligence } from '@/lib/productMaster/types'
import {
  battleWinFillPct,
  isBuildingSignal,
  jobStatusCopy,
  rankStandingFillPct,
  raterFloorProgress,
  type HeadToHeadJob,
  type HeadlineStanding,
  type IntelligenceVolumeStat,
  type JobStandingView,
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

function RankLadder({ rank, pool }: { rank: number; pool: number }) {
  const ticks = Math.min(Math.max(pool, 2), 36)
  const marker = Math.round(((rank - 1) / Math.max(pool - 1, 1)) * (ticks - 1))
  return (
    <div
      className="pm-intel-ladder"
      role="img"
      aria-label={`Rank ${rank} of ${pool}`}
    >
      {Array.from({ length: ticks }, (_, i) => (
        <span
          key={i}
          className={`pm-intel-ladder-tick${i === marker ? ' is-here' : ''}${i < marker ? ' is-ahead' : ''}`}
        />
      ))}
    </div>
  )
}

function WinRing({ pct }: { pct: number }) {
  const r = 20
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = c * (1 - clamped / 100)
  return (
    <div className="pm-intel-ring" aria-label={`${clamped}% win rate`}>
      <svg viewBox="0 0 48 48" width="72" height="72" aria-hidden>
        <circle className="pm-intel-ring-track" cx="24" cy="24" r={r} />
        <circle
          className="pm-intel-ring-fill"
          cx="24"
          cy="24"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <div className="pm-intel-ring-label">
        <span className="pm-intel-ring-value">{clamped}%</span>
        <span className="pm-intel-ring-sub">win rate</span>
      </div>
    </div>
  )
}

function Chip({ children, tone = 'sage' }: { children: ReactNode; tone?: 'sage' | 'amber' }) {
  return <span className={`pm-intel-chip pm-intel-chip--${tone}`}>{children}</span>
}

function standingCells(standing: JobStandingView) {
  const fill = rankStandingFillPct(standing.rankValue, standing.poolValue)
  const win = battleWinFillPct(standing.battlesWon, standing.battlesTotal)
  return { fill, win }
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
  const building = isBuildingSignal({
    uniqueRaters: intelligence?.unique_raters,
    minRaters: intelligence?.min_raters_to_publish,
    battlesTotal: headline?.battlesTotal ?? intelligence?.total_battles,
  })
  const adminOnly = Boolean(intelligence?.admin_only)
  const draftStats = volume.filter((s) => s.key === 'taste' || s.key === 'health')
  const coreStats = volume.filter((s) => s.key !== 'taste' && s.key !== 'health')

  return (
    <div className="pm-intel-panel">
      <header className="pm-intel-header">
        <h2 className="pm-intel-title">Intelligence</h2>
        <p className="pm-intel-sub">
          How this product stands in Dough head-to-heads — the jobs shoppers actually vote on.
        </p>
      </header>

      {headline ? (
        <section className={`pm-intel-hero${building ? ' is-building' : ''}`}>
          <div className="pm-intel-hero-wash" aria-hidden />
          <div className="pm-intel-hero-body">
            <div className="pm-intel-hero-main">
              <div className="pm-intel-hero-kicker">
                <p className="pm-intel-eyebrow">Standing</p>
                {building ? <Chip tone="amber">Building signal</Chip> : null}
              </div>
              <p className="pm-intel-hero-rank">{headline.rankLabel}</p>
              {headline.rankValue != null && headline.poolValue != null ? (
                <RankLadder rank={headline.rankValue} pool={headline.poolValue} />
              ) : heroFill != null ? (
                <Meter pct={heroFill} label="Standing in compare set" />
              ) : null}
              <p className="pm-intel-hero-q">&ldquo;{headline.question}&rdquo;</p>
              <div className="pm-intel-hero-meta">
                {headline.eloLabel ? <Chip>Elo {headline.eloLabel}</Chip> : null}
                {headline.recordLabel ? <Chip>{headline.recordLabel}</Chip> : null}
                {headline.setName ? <Chip>{headline.setName}</Chip> : null}
                {headline.maturityLabel ? <Chip>{headline.maturityLabel}</Chip> : null}
              </div>
            </div>

            <div className="pm-intel-hero-side">
              {heroWin != null ? <WinRing pct={heroWin} /> : null}
              {heroFill != null ? (
                <div className="pm-intel-hero-gauge">
                  <p className="pm-intel-hero-gauge-value">{heroFill}%</p>
                  <p className="pm-intel-hero-gauge-label">toward top of set</p>
                </div>
              ) : null}
            </div>
          </div>

          <p className="pm-intel-hero-note pm-intel-hero-note--warn">
            Unpublished ranking. Organic Elo has no confidence interval.
          </p>
        </section>
      ) : null}

      {volume.length > 0 ? (
        <section className="pm-intel-volume portal-panel" aria-label="Volume">
          <div className="pm-intel-strip">
            {coreStats.map((stat) => {
              const isRaters = stat.key === 'raters'
              return (
                <div key={stat.key} className="pm-intel-strip-cell">
                  <p className="pm-intel-strip-label">{stat.label}</p>
                  <p className="pm-intel-strip-value">{stat.value}</p>
                  {isRaters && floor ? (
                    <>
                      <Meter
                        pct={floor.pct}
                        tone={floor.pct >= 100 ? 'sage' : 'amber'}
                        label="Raters toward publishable score"
                      />
                      <p className="pm-intel-strip-sub">
                        {floor.have.toLocaleString()} of {floor.need.toLocaleString()} to publish
                      </p>
                    </>
                  ) : null}
                </div>
              )
            })}
            {draftStats.map((stat) => (
              <div key={stat.key} className="pm-intel-strip-cell pm-intel-strip-cell--draft">
                <p className="pm-intel-strip-label">{stat.label}</p>
                <p className="pm-intel-strip-value">{stat.value}</p>
                <p className="pm-intel-strip-sub">Draft · not published</p>
              </div>
            ))}
          </div>
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

          <div className="pm-intel-table portal-panel">
            <div className="pm-intel-table-head" aria-hidden>
              <span>Job</span>
              <span>Rank</span>
              <span>Elo</span>
              <span>Record</span>
            </div>
            {jobs.map((job) => {
              const title = job.question ?? job.setName ?? 'Comparison job'
              const quoted = Boolean(job.question)
              const status = jobStatusCopy(job, showJobScores)
              const standing = job.standings[0] ?? null
              const { fill, win } = standing
                ? standingCells(standing)
                : { fill: null, win: null }

              return (
                <article key={job.compareGroupId} className="pm-intel-table-row">
                  <div className="pm-intel-table-job">
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
                      {standing?.maturityLabel || standing?.seedSource ? (
                        <p className="pm-intel-job-meta">
                          {[
                            standing.maturityLabel,
                            standing.seedSource ? `Seeded from ${standing.seedSource}` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      ) : null}
                      {status ? <p className="pm-intel-status">{status}</p> : null}
                    </div>
                  </div>

                  {standing ? (
                    <>
                      <div className="pm-intel-table-metric">
                        <span className="pm-intel-table-mobile-label">Rank</span>
                        <span className="pm-intel-standing-value">
                          {standing.rankLabel ??
                            (standing.rankComparable === false ? 'Not comparable' : '—')}
                        </span>
                        {fill != null ? (
                          <Meter pct={fill} label={`Standing ${standing.rankLabel ?? ''}`} />
                        ) : null}
                      </div>
                      <div className="pm-intel-table-metric">
                        <span className="pm-intel-table-mobile-label">Elo</span>
                        <span className="pm-intel-standing-value">
                          {standing.eloLabel ?? '—'}
                        </span>
                      </div>
                      <div className="pm-intel-table-metric">
                        <span className="pm-intel-table-mobile-label">Record</span>
                        <span className="pm-intel-standing-value">
                          {standing.recordLabel ?? '—'}
                        </span>
                        {win != null ? <Meter pct={win} tone="sage" label="Win rate" /> : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="pm-intel-table-metric pm-intel-table-metric--empty">—</div>
                      <div className="pm-intel-table-metric pm-intel-table-metric--empty">—</div>
                      <div className="pm-intel-table-metric pm-intel-table-metric--empty">—</div>
                    </>
                  )}
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
