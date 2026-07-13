import type { ReactNode } from 'react'
import type {
  AttributeImportance,
  ChoiceDrivers,
  DriverRow,
  ExperiencedReportEnvelope,
  ExperienceLift,
  HeadlineWinRateRow,
  OpponentRow,
  RankValidation,
  RepurchaseIntent,
  RepurchaseSessionMetric,
} from '@/lib/experiencedReport/types'
import {
  formatOf100,
  formatPct01,
  formatSnapshotDate,
  plainWithheldReason,
} from '@/lib/experiencedReport/withheldCopy'
import { CombatantPortrait } from '@/components/conceptReport/CombatantPortrait'
import { SimulatedDataBanner } from '@/components/conceptReport/SimulatedDataBanner'
import { ExportReportButton } from '@/components/conceptReport/ExportReportButton'
import { ExperienceSplitLabel } from './ExperienceSplitLabel'
import { WithheldMetric } from './WithheldMetric'
import { Chip, DECK_WIDTH, ProportionTrack, SectionShell } from './deckChrome'

function stageChipLabel(stage: ExperiencedReportEnvelope['report']['report_stage']): string {
  if (stage.is_final || stage.stage === 'final') return 'Final'
  return 'Preliminary — still collecting'
}

function headlineStatusChip(rows: HeadlineWinRateRow[]): {
  label: string
  tone: 'pro' | 'amber' | 'neutral'
} {
  if (rows.length === 0) return { label: 'No headline', tone: 'neutral' }
  if (rows.every((r) => !r.reportable)) return { label: 'Below floor', tone: 'amber' }
  if (rows.some((r) => r.reportable)) return { label: 'Reportable', tone: 'pro' }
  return { label: 'Measured', tone: 'neutral' }
}

/** Stronger claim first — never pool. */
function orderedHeadlineRows(rows: HeadlineWinRateRow[]): HeadlineWinRateRow[] {
  return [...rows].sort((a, b) => {
    const rank = (s: string) =>
      s === 'experienced_vs_experienced' ? 0 : s === 'experienced_vs_hypothetical' ? 1 : 2
    return rank(String(a.experience_split)) - rank(String(b.experience_split))
  })
}

function toOf100(value: number): number {
  return value <= 1 ? Math.round(value * 100) : Math.round(value)
}

function toPct(value: number): number {
  return value <= 1 ? value * 100 : value
}

function CiCaption({ lo, hi }: { lo: number | null; hi: number | null }) {
  if (lo == null || hi == null) return null
  const a = toOf100(lo)
  const b = toOf100(hi)
  return (
    <p
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        color: 'var(--ink-muted)',
        margin: '8px 0 0',
      }}
    >
      Likely between {Math.min(a, b)} and {Math.max(a, b)} out of 100.
    </p>
  )
}

function QuietNote({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--ink-faint)',
        margin: '16px 0 0',
        maxWidth: 640,
      }}
    >
      {children}
    </p>
  )
}

function DeckColdOpen({
  envelope,
  backHref,
}: {
  envelope: ExperiencedReportEnvelope
  backHref: string
}) {
  const { report } = envelope
  const focal = report.focal_product
  const stage = report.report_stage
  const status = headlineStatusChip(report.headline_win_rate)
  const lead = orderedHeadlineRows(report.headline_win_rate)[0]
  const nDecisive = lead?.n_decisive
  const metaParts = [
    `${report.participation.n_users} people who’ve had it`,
    `${report.participation.n_sessions} sessions`,
  ]
  if (nDecisive != null) metaParts.push(`${nDecisive} choices`)

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
          className="no-print"
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
          <Chip tone="neutral">{stageChipLabel(stage)}</Chip>
          <Chip tone={status.tone}>{status.label}</Chip>
          {formatSnapshotDate(envelope.snapshot_date ?? envelope.computed_at) ? (
            <Chip>
              Snapshot {formatSnapshotDate(envelope.snapshot_date ?? envelope.computed_at)}
            </Chip>
          ) : null}
          <Chip>Frozen · reproducible</Chip>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <CombatantPortrait name={focal.name} battleIntent="own_concept_arm" size={72} />
          <div style={{ minWidth: 0 }}>
            {focal.brand ? (
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--sage-dark)',
                  margin: '0 0 8px',
                }}
              >
                {focal.brand}
              </p>
            ) : null}
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
              {focal.name}
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
              {metaParts.join(' · ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

function HeadlineClaim({
  row,
  focalName,
}: {
  row: HeadlineWinRateRow
  focalName: string
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <ExperienceSplitLabel split={row.experience_split} focalName={focalName} />
      <WithheldMetric metric={row}>
        <div className="deck-enter-verdict">
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(56px, 8vw, 80px)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: 'var(--sage-dark)',
            }}
          >
            {row.value != null ? formatOf100(row.value) : '—'}
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--ink-muted)',
                marginLeft: 10,
              }}
            >
              of 100
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 17,
              lineHeight: 1.45,
              color: 'var(--ink)',
              margin: '16px 0 0',
              maxWidth: 520,
            }}
          >
            Chose {focalName}{' '}
            {row.value != null ? `${formatOf100(row.value)} of 100` : '—'} forced choices in this
            slice.
          </p>
          <ProportionTrack
            value={row.value ?? 0}
            ciLow={row.ci_low}
            ciHigh={row.ci_high}
            own
          />
          <CiCaption lo={row.ci_low} hi={row.ci_high} />
          {row.n_decisive != null ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--ink-faint)',
                margin: '8px 0 0',
              }}
            >
              {row.n_wins != null ? `${row.n_wins} wins` : null}
              {row.n_wins != null && row.n_decisive != null ? ' · ' : null}
              {row.n_decisive} decisive
              {row.n_ties != null ? ` · ${row.n_ties} ties` : null}
            </p>
          ) : null}
        </div>
      </WithheldMetric>
    </div>
  )
}

function DeckVerdict({ envelope }: { envelope: ExperiencedReportEnvelope }) {
  const { report } = envelope
  const rows = orderedHeadlineRows(report.headline_win_rate)
  const focalName = report.focal_product.name

  return (
    <section
      style={{
        maxWidth: DECK_WIDTH,
        margin: '0 auto',
        padding: '48px 28px 40px',
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
        Preference among people who’ve consumed it
      </p>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--ink-muted)',
          margin: '0 0 28px',
          maxWidth: 560,
        }}
      >
        What was measured — not a launch recommendation. Experience splits are never pooled.
      </p>
      {rows.map((row, i) => (
        <HeadlineClaim
          key={`${row.experience_split}-${i}`}
          row={row}
          focalName={focalName}
        />
      ))}
    </section>
  )
}

function DeckField({
  rows,
  focalName,
  methodologyNote,
}: {
  rows: OpponentRow[] | null
  focalName: string
  methodologyNote?: string | null
}) {
  if (rows == null) return null

  const ranked = [...rows].sort((a, b) => {
    if (a.reportable && b.reportable && a.value != null && b.value != null) {
      return b.value - a.value
    }
    if (a.reportable !== b.reportable) return a.reportable ? -1 : 1
    return a.opponent_name.localeCompare(b.opponent_name)
  })

  return (
    <SectionShell
      title="Against the shelf"
      sub={`${focalName} vs each named competitor — directional under one primary signal.`}
      caveat={methodologyNote}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {ranked.map((row) => (
          <div
            key={`${row.opponent_product_id ?? row.opponent_name}-${row.experience_split ?? ''}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: 18,
              alignItems: 'start',
            }}
          >
            <CombatantPortrait
              name={row.opponent_name}
              battleIntent="direct_competitor"
              size={52}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: 'var(--ink)',
                  marginBottom: 4,
                }}
              >
                {row.opponent_name}
              </div>
              {row.opponent_brand ? (
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>
                  {row.opponent_brand}
                </div>
              ) : null}
              {row.experience_split ? (
                <ExperienceSplitLabel split={row.experience_split} focalName={focalName} />
              ) : null}
              <WithheldMetric metric={row}>
                <ProportionTrack
                  value={row.value ?? 0}
                  ciLow={row.ci_low}
                  ciHigh={row.ci_high}
                  own={false}
                />
                <CiCaption lo={row.ci_low} hi={row.ci_high} />
              </WithheldMetric>
            </div>
            <div style={{ textAlign: 'right', minWidth: 64 }}>
              {row.reportable && row.value != null ? (
                <>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 32,
                      lineHeight: 1,
                      color: 'var(--ink)',
                    }}
                  >
                    {formatOf100(row.value)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                    of 100
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Withheld</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

function DriverColumn({
  title,
  emptyCopy,
  drivers,
}: {
  title: string
  emptyCopy: string
  drivers: DriverRow[]
}) {
  const allWithheld =
    drivers.length > 0 && drivers.every((d) => !d.reportable)
  const showEmpty = drivers.length === 0 || allWithheld
  const withheldSeed = drivers[0]

  return (
    <div style={{ minWidth: 0 }}>
      <h3
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          margin: '0 0 16px',
        }}
      >
        {title}
      </h3>
      {showEmpty ? (
        <WithheldMetric
          metric={{
            reportable: false,
            withheld_reason: withheldSeed?.withheld_reason ?? emptyCopy,
            n_answers: withheldSeed?.n_answers,
            n_citing: withheldSeed?.n_citing,
            n_users: withheldSeed?.n_users,
            n_decisive: withheldSeed?.n_decisive,
          }}
        >
          {null}
        </WithheldMetric>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {drivers.map((d) => (
            <div key={d.driver}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  color: 'var(--ink)',
                }}
              >
                <span style={{ fontWeight: 500 }}>{d.driver}</span>
                {d.reportable && d.share != null ? (
                  <span style={{ color: 'var(--ink-muted)', flexShrink: 0 }}>
                    {formatPct01(d.share)}
                  </span>
                ) : null}
              </div>
              <WithheldMetric metric={d}>
                <div
                  style={{
                    marginTop: 6,
                    height: 8,
                    background: 'var(--surface-1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                  aria-hidden
                >
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, toPct(d.share ?? 0)))}%`,
                      height: '100%',
                      background: 'var(--sage)',
                      opacity: 0.85,
                    }}
                  />
                </div>
              </WithheldMetric>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DeckDrivers({
  drivers,
}: {
  drivers: ChoiceDrivers | null
}) {
  if (drivers == null) return null
  const won = drivers.by_outcome.focal_won
  const lost = drivers.by_outcome.focal_lost

  return (
    <SectionShell
      title="Why they chose — or didn’t"
      sub={drivers.interpretation ?? undefined}
      caveat={drivers.timing_note}
    >
      <div
        className="deck-drivers-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
        }}
      >
        <DriverColumn
          title="When they chose you"
          emptyCopy="Not enough decisive wins to break down yet."
          drivers={won}
        />
        <DriverColumn
          title="When they chose against you"
          emptyCopy="Not enough decisive losses to break down yet."
          drivers={lost}
        />
      </div>
      {drivers.presentation_control ? (
        <QuietNote>{drivers.presentation_control}</QuietNote>
      ) : null}
    </SectionShell>
  )
}

function DeckAttributeImportance({
  data,
}: {
  data: AttributeImportance | null
}) {
  if (data == null) return null
  const attrs = data.attributes

  return (
    <SectionShell
      title="What matters in the category"
      sub={data.interpretation ?? 'Best-minus-worst importance — compelling vs objectionable.'}
      caveat={data.estimator_note}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {attrs.map((a) => {
          const score = a.bw_score
          const mid = 50
          const pct =
            score == null ? mid : mid + Math.max(-1, Math.min(1, score)) * 50

          return (
            <div key={a.attribute}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{a.attribute}</span>
                {a.reportable && score != null ? (
                  <span style={{ color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {score > 0 ? '+' : ''}
                    {score.toFixed(2)}
                  </span>
                ) : null}
              </div>
              <WithheldMetric metric={a}>
                <div
                  style={{
                    position: 'relative',
                    height: 14,
                    background: 'var(--surface-1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                  aria-hidden
                  title={
                    score != null && Math.abs(score) < 0.05
                      ? 'Near zero means neither compelling nor objectionable — not that it was rarely seen.'
                      : undefined
                  }
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: 'var(--mist)',
                    }}
                  />
                  {a.bw_ci_low != null && a.bw_ci_high != null ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${mid + Math.max(-1, Math.min(1, a.bw_ci_low)) * 50}%`,
                        width: `${Math.abs(
                          (Math.max(-1, Math.min(1, a.bw_ci_high)) -
                            Math.max(-1, Math.min(1, a.bw_ci_low))) *
                            50
                        )}%`,
                        top: 2,
                        bottom: 2,
                        background: 'var(--fill-pro)',
                        opacity: 0.45,
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      position: 'absolute',
                      left: score != null && score < 0 ? `${pct}%` : '50%',
                      width:
                        score == null
                          ? 0
                          : `${Math.abs(score) * 50}%`,
                      top: 3,
                      bottom: 3,
                      background: score != null && score < 0 ? 'var(--amber)' : 'var(--sage)',
                      borderRadius: 1,
                    }}
                  />
                </div>
              </WithheldMetric>
            </div>
          )
        })}
      </div>
      {data.variance_note ? <QuietNote>{data.variance_note}</QuietNote> : null}
    </SectionShell>
  )
}

const REPURCHASE_ORDER = ['definite_yes', 'no', 'top_two_box'] as const

function repurchaseMetricLabel(metric: string): string {
  switch (metric) {
    case 'definite_yes':
      return 'Definite yes'
    case 'no':
      return 'No'
    case 'top_two_box':
      return 'Yes + maybe'
    default:
      return metric.replace(/_/g, ' ')
  }
}

function DeckLoyalty({ data }: { data: RepurchaseIntent | null }) {
  if (data == null) return null

  const bySession = new Map<number, RepurchaseSessionMetric[]>()
  for (const row of data.by_session) {
    const list = bySession.get(row.session_number) ?? []
    list.push(row)
    bySession.set(row.session_number, list)
  }
  const sessions = [...bySession.keys()].sort((a, b) => a - b)

  return (
    <SectionShell
      title="Would they buy again"
      sub={
        data.interpretation ??
        'Full yes / no / yes+maybe set — top-two-box is never shown alone.'
      }
      caveat={data.timing_note}
    >
      {sessions.map((session) => {
        const rows = bySession.get(session) ?? []
        const ordered = [...rows].sort((a, b) => {
          const ia = REPURCHASE_ORDER.indexOf(a.metric as (typeof REPURCHASE_ORDER)[number])
          const ib = REPURCHASE_ORDER.indexOf(b.metric as (typeof REPURCHASE_ORDER)[number])
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
        })
        // Always render the full set together — never feature top_two_box alone as a headline.
        const set =
          ordered.length === 1 && ordered[0].metric === 'top_two_box'
            ? ordered
            : ordered

        return (
          <div key={session} style={{ marginBottom: 32 }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
                marginBottom: 14,
              }}
            >
              Session {session}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.max(set.length, 1)}, minmax(0, 1fr))`,
                gap: 16,
              }}
            >
              {set.map((row) => (
                <div
                  key={`${session}-${row.metric}`}
                  style={{
                    padding: 14,
                    background: 'var(--paper)',
                    borderRadius: 8,
                    border: '1px solid var(--mist)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-faint)',
                      marginBottom: 10,
                    }}
                  >
                    {repurchaseMetricLabel(row.metric)}
                  </div>
                  <WithheldMetric metric={row}>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 36,
                        lineHeight: 1,
                        color: 'var(--ink)',
                      }}
                    >
                      {row.rate != null ? formatPct01(row.rate) : '—'}
                    </div>
                    {row.ci_low != null && row.ci_high != null ? (
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--ink-muted)',
                          margin: '8px 0 0',
                        }}
                      >
                        Likely {formatPct01(row.ci_low)}–{formatPct01(row.ci_high)}
                      </p>
                    ) : null}
                  </WithheldMetric>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </SectionShell>
  )
}

function DeckLift({ lift }: { lift: ExperienceLift | null }) {
  if (lift == null) return null

  const warning =
    lift.confound_warning?.trim() ||
    'Associational longitudinal signal — not evidence that the study caused preference change.'

  return (
    <SectionShell
      title="Did preference move"
      sub="Organic preference drift after claiming — associational, not causal."
    >
      <div
        role="note"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--text-warning)',
          background: 'var(--bg-warning)',
          borderRadius: 8,
          padding: '14px 16px',
          marginBottom: 20,
          border: '1px solid rgba(138, 75, 15, 0.2)',
        }}
      >
        {warning}
      </div>

      {!lift.reportable ? (
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--ink)',
            padding: '4px 0 8px',
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 500 }}>
            {plainWithheldReason(lift.withheld_reason, {
              n_users: lift.n_users_no_baseline ?? lift.n_users,
            })}
          </p>
          {lift.n_users_no_baseline != null ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
              {lift.n_users_no_baseline} respondents had no prior baseline preference history to
              measure drift against
              {lift.n_users_with_baseline != null
                ? ` · ${lift.n_users_with_baseline} with baseline`
                : ''}
              .
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              lineHeight: 1.5,
              color: 'var(--ink-muted)',
              margin: '0 0 12px',
            }}
          >
            Organic preference changed after claiming (associational, not caused by the study).
          </p>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 48,
              lineHeight: 1,
              color: 'var(--sage-dark)',
            }}
          >
            {lift.mean_elo_delta != null
              ? `${lift.mean_elo_delta > 0 ? '+' : ''}${lift.mean_elo_delta.toFixed(1)}`
              : '—'}
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '10px 0 0' }}>
            Mean Elo delta
            {lift.ci_low != null && lift.ci_high != null
              ? ` · likely ${lift.ci_low.toFixed(1)} to ${lift.ci_high.toFixed(1)}`
              : ''}
          </p>
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '8px 0 0' }}>
            {[
              lift.n_moved_up != null ? `${lift.n_moved_up} up` : null,
              lift.n_moved_down != null ? `${lift.n_moved_down} down` : null,
              lift.n_unchanged != null ? `${lift.n_unchanged} unchanged` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      )}
    </SectionShell>
  )
}

function DeckRankValidation({ data }: { data: RankValidation | null }) {
  if (data == null) return null

  const order = (c: string) => (c === 'battled' ? 0 : c === 'inferred' ? 1 : 2)
  const rows = [...data.by_pair_class].sort(
    (a, b) => order(String(a.pair_class)) - order(String(b.pair_class))
  )

  return (
    <SectionShell
      title="Does the ranking hold up"
      sub={data.interpretation ?? undefined}
      caveat={data.undetermined_note}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {rows.map((row) => {
          const isBattled = row.pair_class === 'battled'
          const title = isBattled
            ? 'Battled pairs — stated ranking vs choices made'
            : row.pair_class === 'inferred'
              ? 'Inferred pairs — model accuracy on unseen pairs (not evidence about the product)'
              : String(row.pair_class).replace(/_/g, ' ')

          return (
            <div key={String(row.pair_class)}>
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '0 0 10px',
                }}
              >
                {title}
              </h3>
              <WithheldMetric metric={row}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 40,
                    lineHeight: 1,
                    color: isBattled ? 'var(--sage-dark)' : 'var(--ink-muted)',
                  }}
                >
                  {row.agreement_rate != null ? formatPct01(row.agreement_rate) : '—'}
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--ink-muted)',
                      marginLeft: 10,
                    }}
                  >
                    agreement
                  </span>
                </div>
                {row.ci_low != null && row.ci_high != null ? (
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '8px 0 0' }}>
                    Likely {formatPct01(row.ci_low)}–{formatPct01(row.ci_high)}
                  </p>
                ) : null}
                <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '6px 0 0' }}>
                  {[
                    row.n_agree != null ? `${row.n_agree} agree` : null,
                    row.n_disagree != null ? `${row.n_disagree} disagree` : null,
                    row.n_undetermined != null
                      ? `${row.n_undetermined} undetermined`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </WithheldMetric>
            </div>
          )
        })}
      </div>
    </SectionShell>
  )
}

function methodologyProse(m: Record<string, unknown> | null | undefined): string[] {
  if (!m) return []
  const keys = [
    'estimand',
    'experience_definition',
    'withheld_semantics',
    'absent_section_semantics',
    'independence_note',
    'multiple_comparison_note',
    'drift_causality_note',
    'presentation_control',
    'evidence_note',
    'inference_note',
    'comparison_task',
    'win_rate_method',
  ] as const
  const out: string[] = []
  for (const k of keys) {
    const v = m[k]
    if (typeof v === 'string' && v.trim()) out.push(v.trim())
  }
  return out
}

function DeckTrust({ envelope }: { envelope: ExperiencedReportEnvelope }) {
  const { report } = envelope
  const rel = report.reliability
  const evidence = report.evidence_composition
  const method = report.methodology
  const prose = methodologyProse(method as Record<string, unknown> | null)

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
          Evidence quality & methodology
        </summary>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {rel ? (
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  margin: '0 0 10px',
                }}
              >
                Test–retest reliability
              </h3>
              <WithheldMetric metric={rel}>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)', margin: 0 }}>
                  Consistency{' '}
                  {rel.consistency_rate != null ? formatPct01(rel.consistency_rate) : '—'}
                  {rel.n_users_with_repeats != null
                    ? ` among ${rel.n_users_with_repeats} people with repeats`
                    : ''}
                  .
                </p>
              </WithheldMetric>
              {rel.scope_note ? <QuietNote>{rel.scope_note}</QuietNote> : null}
            </div>
          ) : null}

          {evidence ? (
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  margin: '0 0 10px',
                }}
              >
                How we know they consumed it
              </h3>
              {evidence.receipt_note ? (
                <QuietNote>{evidence.receipt_note}</QuietNote>
              ) : null}
              <ul
                style={{
                  listStyle: 'none',
                  margin: '12px 0 0',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {evidence.by_grade.map((g, i) => {
                  const key = g.evidence_split ?? `grade-${i}`
                  const semantics =
                    (g.evidence_split && evidence.grade_semantics[g.evidence_split]) ||
                    undefined
                  return (
                    <li key={key} style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
                      <strong style={{ textTransform: 'capitalize' }}>
                        {(g.evidence_split ?? 'grade').replace(/_/g, ' ')}
                      </strong>
                      {semantics ? (
                        <span style={{ color: 'var(--ink-muted)' }}> — {semantics}</span>
                      ) : null}
                      <div style={{ marginTop: 6 }}>
                        <WithheldMetric metric={g}>
                          <span style={{ color: 'var(--ink-muted)' }}>
                            {g.value != null ? formatPct01(g.value) : '—'}
                            {g.n_users != null ? ` · ${g.n_users} people` : ''}
                            {g.n_decisive != null ? ` · ${g.n_decisive} decisive` : ''}
                          </span>
                        </WithheldMetric>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {prose.length > 0 ? (
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  margin: '0 0 10px',
                }}
              >
                Methodology
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {prose.map((p) => (
                  <li
                    key={p.slice(0, 48)}
                    style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-muted)' }}
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
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
          {formatSnapshotDate(envelope.snapshot_date ?? envelope.computed_at) ? (
            <div>
              Snapshot {formatSnapshotDate(envelope.snapshot_date ?? envelope.computed_at)}
            </div>
          ) : null}
          <div>Frozen · reproducible</div>
        </div>
      </footer>
    </section>
  )
}

export function ExperiencedReportDeck({
  envelope,
  backHref = '/studies',
}: {
  envelope: ExperiencedReportEnvelope
  backHref?: string
}) {
  const { report } = envelope
  const multiNote =
    typeof report.methodology?.multiple_comparison_note === 'string'
      ? report.methodology.multiple_comparison_note
      : null

  return (
    <div
      className="experienced-report-deck concept-report-deck"
      style={{ background: 'var(--cream)', minHeight: '100vh' }}
    >
      {envelope.is_simulated === true ? <SimulatedDataBanner /> : null}

      <DeckColdOpen envelope={envelope} backHref={backHref} />
      <DeckVerdict envelope={envelope} />
      <DeckField
        rows={report.per_opponent}
        focalName={report.focal_product.name}
        methodologyNote={multiNote}
      />
      <DeckDrivers drivers={report.choice_drivers} />
      <DeckAttributeImportance data={report.attribute_importance} />
      <DeckLoyalty data={report.repurchase_intent} />
      <DeckLift lift={report.experience_lift_vs_baseline} />
      <DeckRankValidation data={report.rank_validation} />
      <DeckTrust envelope={envelope} />
    </div>
  )
}
