import type { ReactNode } from 'react'
import type { ConceptMissionReport, WinRateFieldRow } from '@/lib/conceptReport/types'
import {
  battleIntentLabel,
  buildConfidentVerdictLine,
  buildProvisionalVerdictLine,
  findingStatusChip,
  formatPctPoint,
  formatPrice,
  formatSnapshotDate,
  isConfidentVerdict,
  isOwnConceptIntent,
  isThinSampleReport,
  thinSampleBannerCopy,
} from '@/lib/conceptReport/copy'
import { CombatantPortrait } from './CombatantPortrait'
import { WinRateTrack } from './WinRateTrack'
import { SimulatedDataBanner } from './SimulatedDataBanner'
import { ExportReportButton } from './ExportReportButton'
import { DeckQuestions } from './DeckQuestions'

const DECK_WIDTH = 920

function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'pro' | 'amber'
}) {
  const colors =
    tone === 'pro'
      ? { color: 'var(--text-pro)', background: 'var(--bg-pro)' }
      : tone === 'amber'
        ? { color: 'var(--amber)', background: 'var(--amber-soft)' }
        : { color: 'var(--ink-muted)', background: 'var(--surface-1)' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 4,
        ...colors,
      }}
    >
      {children}
    </span>
  )
}

function DeckColdOpen({
  report,
  thin,
  backHref,
}: {
  report: ConceptMissionReport
  thin: boolean
  backHref: string
}) {
  const title = report.study_title?.trim() || 'Concept study report'
  const meta = [
    `${report.n_concepts} concept${report.n_concepts === 1 ? '' : 's'} vs ${report.n_products} shelf`,
    `${report.n_respondents} people`,
    `${report.n_decisive_battles} choices`,
  ].join(' · ')

  return (
    <header
      className="deck-cold-open"
      style={{
        position: 'relative',
        padding: '56px 28px 48px',
        background:
          'linear-gradient(165deg, #fffdf8 0%, var(--cream) 45%, rgba(62, 107, 74, 0.08) 100%)',
        borderBottom: '1px solid var(--mist)',
      }}
    >
      <div style={{ maxWidth: DECK_WIDTH, margin: '0 auto' }}>
        <a
          href={backHref}
          style={{
            fontSize: 12,
            color: 'var(--ink-faint)',
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: 28,
          }}
        >
          ← Back to studies
        </a>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <Chip tone={thin ? 'amber' : 'pro'}>{findingStatusChip(report.finding, thin)}</Chip>
          {formatSnapshotDate(report.snapshot_date ?? report.computed_at) ? (
            <Chip>Snapshot {formatSnapshotDate(report.snapshot_date ?? report.computed_at)}</Chip>
          ) : null}
          <Chip>Frozen · reproducible</Chip>
        </div>
        <h1
          className="deck-enter-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5.5vw, 52px)',
            fontWeight: 400,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            margin: '0 0 16px',
            maxWidth: 780,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            lineHeight: 1.5,
            color: 'var(--ink-muted)',
            margin: 0,
            maxWidth: 560,
          }}
        >
          {meta}
        </p>
      </div>
    </header>
  )
}

function DeckVerdictNext({
  report,
  thin,
}: {
  report: ConceptMissionReport
  thin: boolean
}) {
  const confident = isConfidentVerdict(report.decision_frame, thin)
  const top = report.finding.top
  const rate = top.win_rate_of_100
  const verdictLine = confident
    ? buildConfidentVerdictLine(report.finding)
    : buildProvisionalVerdictLine(report.finding)
  const frame = report.decision_frame

  return (
    <section
      style={{
        maxWidth: DECK_WIDTH,
        margin: '0 auto',
        padding: '48px 28px 40px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)',
          gap: 40,
          alignItems: 'start',
        }}
        className="deck-verdict-grid"
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              margin: '0 0 12px',
            }}
          >
            {confident ? 'The finding' : 'Provisional read'}
          </p>
          <div
            className="deck-enter-verdict"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(56px, 8vw, 80px)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: confident ? 'var(--sage-dark)' : 'var(--ink-muted)',
              marginBottom: 8,
            }}
          >
            {rate != null ? Math.round(rate) : '—'}
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--ink-muted)',
                marginLeft: 10,
                letterSpacing: 0,
              }}
            >
              of 100
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--ink-faint)',
              margin: '0 0 16px',
            }}
          >
            {top.display_name} · wins out of 100 head-to-heads in this field
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: confident ? 22 : 18,
              lineHeight: 1.35,
              color: confident ? 'var(--ink)' : 'var(--ink-muted)',
              margin: '0 0 14px',
              maxWidth: 420,
            }}
          >
            {verdictLine}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--ink-muted)',
              margin: 0,
              maxWidth: 400,
            }}
          >
            The ranking comes only from forced choices between real options. You chose who
            competed; respondents chose who won — no question wording can tip it.
          </p>
        </div>

        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--mist)',
            borderRadius: 10,
            padding: '28px 28px 24px',
            boxShadow: '0 1px 0 rgba(28, 38, 32, 0.04)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              margin: '0 0 12px',
            }}
          >
            What to do next
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--sage-dark)',
              margin: '0 0 14px',
            }}
          >
            {frame.action}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--ink)',
              margin: '0 0 18px',
            }}
          >
            {frame.rationale}
          </p>
          {report.finding.note ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
                margin: 0,
                paddingTop: 14,
                borderTop: '1px solid var(--mist)',
              }}
            >
              {report.finding.note}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function DeckFieldCast({ field }: { field: WinRateFieldRow[] }) {
  return (
    <section
      style={{
        borderTop: '1px solid var(--mist)',
        borderBottom: '1px solid var(--mist)',
        background: 'rgba(255,253,248,0.7)',
        padding: '36px 0 40px',
      }}
    >
      <div style={{ maxWidth: DECK_WIDTH, margin: '0 auto', padding: '0 28px' }}>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            margin: '0 0 20px',
          }}
        >
          The field
        </p>
        <div
          style={{
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            paddingBottom: 8,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {field.map((row) => {
            const own = isOwnConceptIntent(String(row.battle_intent))
            const price = formatPrice(row.frozen_price)
            return (
              <div
                key={row.combatant_ref}
                style={{
                  flex: '0 0 auto',
                  width: 140,
                  padding: 12,
                  borderRadius: 10,
                  background: own ? 'var(--bg-pro)' : 'transparent',
                }}
              >
                <CombatantPortrait
                  name={row.display_name}
                  battleIntent={String(row.battle_intent)}
                  imageUrl={row.image_url}
                  size={72}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginTop: 12,
                    lineHeight: 1.3,
                  }}
                >
                  {row.display_name}
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Chip tone={own ? 'pro' : 'neutral'}>
                    {battleIntentLabel(String(row.battle_intent))}
                  </Chip>
                  {price ? (
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{price}</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function DeckMatchups({ report }: { report: ConceptMissionReport }) {
  const record = report.top_pair_record
  if (!record || record.vs.length === 0) return null

  const topName = record.display_name || report.finding.top.display_name
  const topIntent = String(record.battle_intent || report.finding.top.battle_intent || '')
  const topRow = report.win_rate_field.find((r) => r.combatant_ref === record.combatant_ref)

  return (
    <section style={{ maxWidth: DECK_WIDTH, margin: '0 auto', padding: '48px 28px' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
          color: 'var(--ink)',
        }}
      >
        Why it played that way
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--ink-muted)',
          margin: '0 0 28px',
          maxWidth: 520,
          lineHeight: 1.5,
        }}
      >
        Real head-to-head choices for {topName} against each opponent in this field.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {record.vs.map((m) => {
          const total = m.top_wins + m.opponent_wins
          const winPct = total > 0 ? (m.top_wins / total) * 100 : 50
          const oppIntent = String(m.opponent_intent || 'direct_competitor')
          return (
            <div
              key={m.opponent_ref}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 16,
                alignItems: 'center',
                padding: '18px 20px',
                background: 'var(--paper)',
                border: '1px solid var(--mist)',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <CombatantPortrait
                  name={topName}
                  battleIntent={topIntent}
                  imageUrl={topRow?.image_url}
                  size={48}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{topName}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    won {m.top_wins}–{m.opponent_wins}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 100 }}>
                <div
                  style={{
                    height: 8,
                    width: 100,
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    background: 'var(--surface-1)',
                    margin: '0 auto 6px',
                  }}
                >
                  <div style={{ width: `${winPct}%`, background: 'var(--sage)' }} />
                  <div style={{ flex: 1, background: 'var(--mist)' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{m.shown} shown</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minWidth: 0,
                  justifyContent: 'flex-end',
                  textAlign: 'right',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                    {m.opponent_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    {battleIntentLabel(oppIntent)}
                  </div>
                </div>
                <CombatantPortrait
                  name={m.opponent_name}
                  battleIntent={oppIntent}
                  size={48}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function DeckLadder({ field, thin }: { field: WinRateFieldRow[]; thin: boolean }) {
  return (
    <section
      className="deck-enter-ladder"
      style={{
        maxWidth: DECK_WIDTH,
        margin: '0 auto',
        padding: '40px 28px 48px',
        borderTop: '1px solid var(--mist)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }}
      >
        How often each one wins
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-muted)',
          margin: '0 0 28px',
          maxWidth: 560,
          lineHeight: 1.5,
        }}
      >
        {thin
          ? 'Point estimates only — no reliable ranges yet. Treat the order as directional.'
          : 'Out of 100 forced choices against a random opponent in this field. The shaded band is the range we’re confident the true number falls in.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {field.map((row) => {
          const own = isOwnConceptIntent(String(row.battle_intent))
          const price = formatPrice(row.frozen_price)
          return (
            <div
              key={row.combatant_ref}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 18,
                alignItems: 'start',
                padding: own ? 16 : 0,
                margin: own ? '0 -16px' : 0,
                background: own ? 'var(--bg-pro)' : 'transparent',
                borderRadius: own ? 10 : 0,
              }}
            >
              <CombatantPortrait
                name={row.display_name}
                battleIntent={String(row.battle_intent)}
                imageUrl={row.image_url}
                size={56}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>
                  {row.display_name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                  <Chip tone={own ? 'pro' : 'neutral'}>
                    {battleIntentLabel(String(row.battle_intent))}
                  </Chip>
                  {price ? <Chip>{price}</Chip> : null}
                </div>
                <WinRateTrack row={row} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 36,
                    lineHeight: 1,
                    color: own ? 'var(--text-pro)' : 'var(--ink)',
                  }}
                >
                  {row.win_rate_of_100 != null ? Math.round(row.win_rate_of_100) : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>of 100</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function DeckTrust({ report }: { report: ConceptMissionReport }) {
  return (
    <section
      style={{
        maxWidth: DECK_WIDTH,
        margin: '0 auto',
        padding: '24px 28px 64px',
        borderTop: '1px solid var(--mist)',
      }}
    >
      <details className="deck-trust-details">
        <summary
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--sage-dark)',
            cursor: 'pointer',
            listStyle: 'none',
          }}
        >
          Evidence quality
        </summary>
        <ul
          style={{
            listStyle: 'none',
            margin: '16px 0 0',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {report.position_bias_check?.shown_first_win_rate != null ? (
            <li style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
              <strong>Position bias</strong> —{' '}
              {formatPctPoint(report.position_bias_check.shown_first_win_rate)} shown-first win
              rate. Near 50% means card position didn’t drive who won.
            </li>
          ) : null}
          {report.achieved_pair_coverage?.mean_shown != null ? (
            <li style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
              <strong>Pair coverage</strong> — each matchup shown ~
              {Math.round(report.achieved_pair_coverage.mean_shown)} times
              {report.achieved_pair_coverage.min_shown != null &&
              report.achieved_pair_coverage.max_shown != null
                ? ` (${report.achieved_pair_coverage.min_shown}–${report.achieved_pair_coverage.max_shown})`
                : ''}
              .
            </li>
          ) : null}
          {report.connectivity ? (
            <li style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
              <strong>
                {report.connectivity.fully_connected ? 'Fully comparable' : 'Partially connected'}
              </strong>
              {report.connectivity.fully_connected
                ? ` — all ${report.n_combatants} on one ranking.`
                : '.'}
            </li>
          ) : null}
          {report.design_effect_summary?.interpretation ? (
            <li style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-muted)' }}>
              {report.design_effect_summary.interpretation}
            </li>
          ) : null}
        </ul>
      </details>

      <footer
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid var(--mist)',
        }}
      >
        <ExportReportButton />
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'right' }}>
          {formatSnapshotDate(report.snapshot_date ?? report.computed_at) ? (
            <div>Snapshot {formatSnapshotDate(report.snapshot_date ?? report.computed_at)}</div>
          ) : null}
          <div>Frozen · reproducible</div>
        </div>
      </footer>
    </section>
  )
}

export function ConceptReportDeck({
  report,
  backHref = '/studies',
}: {
  report: ConceptMissionReport
  backHref?: string
}) {
  const thin = isThinSampleReport(report)

  return (
    <div className="concept-report-deck" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {report.is_simulated === true ? <SimulatedDataBanner /> : null}

      {thin ? (
        <div
          className="concept-report-thin-banner"
          role="status"
          style={{
            background: 'var(--amber-soft)',
            borderBottom: '1px solid rgba(192, 120, 24, 0.28)',
            padding: '14px 28px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--amber)',
            fontWeight: 500,
          }}
        >
          <div style={{ maxWidth: DECK_WIDTH, margin: '0 auto' }}>
            {thinSampleBannerCopy(report.n_respondents)}
            {report.min_cluster_warning.trim() ? (
              <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 400, opacity: 0.92 }}>
                {report.min_cluster_warning}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <DeckColdOpen report={report} thin={thin} backHref={backHref} />
      {/* Verdict + next step before full cast — money slide above the fold */}
      <DeckVerdictNext report={report} thin={thin} />
      <DeckFieldCast field={report.win_rate_field} />
      <DeckMatchups report={report} />
      <DeckLadder field={report.win_rate_field} thin={thin} />
      <DeckQuestions questions={report.question_responses} thin={thin} />
      <DeckTrust report={report} />
    </div>
  )
}

/** @deprecated Use ConceptReportDeck */
export { ConceptReportDeck as ConceptReportMemo }
