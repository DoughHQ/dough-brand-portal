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
} from '@/lib/experiencedReport/withheldCopy'
import {
  headlineStatusChip,
  leadHeadlineRow,
  orderedHeadlineRows,
  stageChipLabel,
} from '@/lib/experiencedReport/headline'
import {
  participationLine,
  STRIP_CONFIDENCE_NOTE,
} from '@/lib/experiencedReport/executiveSummary'
import { CombatantPortrait } from '@/components/conceptReport/CombatantPortrait'
import { SimulatedDataBanner } from '@/components/conceptReport/SimulatedDataBanner'
import { ExportReportButton } from '@/components/conceptReport/ExportReportButton'
import { ExperienceSplitLabel, experienceSplitLabel } from './ExperienceSplitLabel'
import { WithheldMetric } from './WithheldMetric'
import { Chip, CoinFlipTrack, SectionShell, ShareBar, BipolarTrack } from './deckChrome'
import { ReportSectionRail } from './ReportSectionRail'
import { REPORT_SECTIONS, pushNote, type SectionMethodNotes } from './reportSections'
import { ExecutiveSummaryStrip } from './ExecutiveSummaryStrip'
import './experiencedReport.css'

const PREFERENCE_METHOD_NOTE =
  'What was measured — not a launch recommendation. Experience splits are never pooled.'

function toOf100(value: number): number {
  return value <= 1 ? Math.round(value * 100) : Math.round(value)
}

function notesFor(bucket: SectionMethodNotes[], section: number): string[] {
  return bucket.find((b) => b.section === section)?.texts ?? []
}

function uniqueSplitDetails(rows: OpponentRow[], focalName: string): string[] {
  const seen = new Set<string>()
  const details: string[] = []
  for (const row of rows) {
    if (!row.experience_split) continue
    const { detail } = experienceSplitLabel(row.experience_split, focalName)
    if (detail && !seen.has(detail)) {
      seen.add(detail)
      details.push(detail)
    }
  }
  return details
}

function collectMethodNotes(envelope: ExperiencedReportEnvelope): SectionMethodNotes[] {
  const { report } = envelope
  const bucket: SectionMethodNotes[] = []
  const s = REPORT_SECTIONS

  pushNote(bucket, 1, s[0].title, PREFERENCE_METHOD_NOTE)

  pushNote(bucket, 2, s[1].title, report.choice_drivers?.timing_note)
  pushNote(bucket, 2, s[1].title, report.choice_drivers?.presentation_control)

  const multi =
    typeof report.methodology?.multiple_comparison_note === 'string'
      ? report.methodology.multiple_comparison_note
      : null
  pushNote(bucket, 3, s[2].title, multi)

  pushNote(bucket, 4, s[3].title, report.attribute_importance?.estimator_note)
  pushNote(bucket, 4, s[3].title, report.attribute_importance?.variance_note)
  pushNote(bucket, 4, s[3].title, report.attribute_importance?.presentation_control)

  pushNote(bucket, 5, s[4].title, report.repurchase_intent?.timing_note)
  pushNote(bucket, 5, s[4].title, report.repurchase_intent?.presentation_control)

  pushNote(bucket, 6, s[5].title, report.rank_validation?.undetermined_note)

  const drift =
    typeof report.methodology?.drift_causality_note === 'string'
      ? report.methodology.drift_causality_note
      : null
  pushNote(bucket, 7, s[6].title, drift)

  return bucket
}

function CiCaption({ lo, hi }: { lo: number | null; hi: number | null }) {
  if (lo == null || hi == null) return null
  const a = toOf100(lo)
  const b = toOf100(hi)
  return (
    <p className="report-footnote" style={{ margin: '8px 0 0' }}>
      Likely between {Math.min(a, b)} and {Math.max(a, b)} out of 100.
    </p>
  )
}

function QuietNote({ children }: { children: ReactNode }) {
  return <p className="report-footnote" style={{ margin: '12px 0 0', fontStyle: 'italic' }}>{children}</p>
}

function SectionEmpty({ reason }: { reason?: string | null }) {
  return (
    <WithheldMetric
      metric={{
        reportable: false,
        withheld_reason: reason?.trim() || 'Not enough responses yet to report this',
      }}
    />
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
  const lead = leadHeadlineRow(report.headline_win_rate)
  const nDecisive = lead?.n_decisive
  const metaParts = [participationLine(report.participation)]
  if (typeof nDecisive === 'number' && nDecisive > 0) {
    metaParts.push(`${nDecisive} choices`)
  }

  return (
    <header className="report-cold-open">
      <div className="report-cold-open-top">
        <a
          href={backHref}
          className="no-print"
          style={{
            fontSize: 12,
            color: 'var(--ink-faint)',
            textDecoration: 'none',
          }}
        >
          ← Back to studies
        </a>
        <div className="report-export no-print">
          <ExportReportButton />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <CombatantPortrait name={focal.name} battleIntent="own_concept_arm" size={56} />
        <div style={{ minWidth: 0, flex: 1 }}>
          {focal.brand ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--sage-dark)',
                margin: '0 0 6px',
              }}
            >
              {focal.brand}
            </p>
          ) : null}
          <div className="report-title-row">
            <h1 className="deck-enter-title">{focal.name}</h1>
            <Chip tone="neutral">{stageChipLabel(stage)}</Chip>
            <Chip tone={status.tone}>{status.label}</Chip>
            {formatSnapshotDate(envelope.snapshot_date ?? envelope.computed_at) ? (
              <Chip>
                Snapshot {formatSnapshotDate(envelope.snapshot_date ?? envelope.computed_at)}
              </Chip>
            ) : null}
            <Chip>Frozen · reproducible</Chip>
          </div>
          <p className="report-body" style={{ margin: 0 }}>
            {metaParts.join(' · ')}
          </p>
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
    <div style={{ marginBottom: 28 }}>
      <ExperienceSplitLabel split={row.experience_split} focalName={focalName} />
      <WithheldMetric metric={row}>
        <div className="deck-enter-verdict">
          <div className="report-headline-figure">
            {row.value != null ? formatOf100(row.value) : '—'}
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--ink-muted)',
                marginLeft: 10,
              }}
            >
              of 100
            </span>
          </div>
          <CoinFlipTrack
            value={row.value ?? 0}
            ciLow={row.ci_low}
            ciHigh={row.ci_high}
            tone="own"
          />
          <CiCaption lo={row.ci_low} hi={row.ci_high} />
          {typeof row.n_decisive === 'number' && row.n_decisive > 0 ? (
            <p className="report-footnote" style={{ margin: '8px 0 0' }}>
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

function DeckVerdict({
  envelope,
  notes,
}: {
  envelope: ExperiencedReportEnvelope
  notes: string[]
}) {
  const { report } = envelope
  const rows = orderedHeadlineRows(report.headline_win_rate)
  const focalName = report.focal_product.name

  return (
    <SectionShell
      id={REPORT_SECTIONS[0].id}
      number={1}
      title={REPORT_SECTIONS[0].title}
      notes={notes}
    >
      {rows.length === 0 ? (
        <SectionEmpty />
      ) : (
        rows.map((row, i) => (
          <HeadlineClaim
            key={`${row.experience_split}-${i}`}
            row={row}
            focalName={focalName}
          />
        ))
      )}
    </SectionShell>
  )
}

function DeckField({
  rows,
  focalName,
  notes,
}: {
  rows: OpponentRow[] | null
  focalName: string
  notes: string[]
}) {
  const ranked = [...(rows ?? [])].sort((a, b) => {
    if (a.reportable && b.reportable && a.value != null && b.value != null) {
      return b.value - a.value
    }
    if (a.reportable !== b.reportable) return a.reportable ? -1 : 1
    return a.opponent_name.localeCompare(b.opponent_name)
  })
  const splitKeys = [
    ...new Set(ranked.map((r) => r.experience_split).filter((s): s is string => Boolean(s))),
  ]
  const mixedSplits = splitKeys.length > 1
  const hoistedDetails = uniqueSplitDetails(ranked, focalName)

  return (
    <SectionShell
      id={REPORT_SECTIONS[2].id}
      number={3}
      title={REPORT_SECTIONS[2].title}
      sub={[
        `${focalName} vs each named competitor — directional under one primary signal.`,
        ...hoistedDetails,
      ]}
      notes={notes}
    >
      {ranked.length === 0 ? (
        <SectionEmpty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {ranked.map((row) => (
            <div
              key={`${row.opponent_product_id ?? row.opponent_name}-${row.experience_split ?? ''}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 14,
                alignItems: 'start',
              }}
            >
              <CombatantPortrait
                name={row.opponent_name}
                battleIntent="direct_competitor"
                size={44}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'var(--ink)',
                    marginBottom: 2,
                  }}
                >
                  {row.opponent_name}
                </div>
                {row.opponent_brand ? (
                  <div className="report-footnote" style={{ marginBottom: 6 }}>
                    {row.opponent_brand}
                  </div>
                ) : null}
                {mixedSplits && row.experience_split ? (
                  <ExperienceSplitLabel
                    split={row.experience_split}
                    focalName={focalName}
                    showDetail={false}
                  />
                ) : null}
                <WithheldMetric metric={row}>
                  <CoinFlipTrack
                    value={row.value ?? 0}
                    ciLow={row.ci_low}
                    ciHigh={row.ci_high}
                    tone="own"
                  />
                  <CiCaption lo={row.ci_low} hi={row.ci_high} />
                </WithheldMetric>
              </div>
              <div style={{ textAlign: 'right', minWidth: 52 }}>
                {row.reportable && row.value != null ? (
                  <>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 28,
                        lineHeight: 1,
                        color: 'var(--sage-dark)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatOf100(row.value)}
                    </div>
                    <div className="report-footnote" style={{ marginTop: 4 }}>
                      of 100
                    </div>
                  </>
                ) : (
                  <div className="report-footnote">Withheld</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

function DriverColumn({
  title,
  emptyCopy,
  drivers,
  tone,
}: {
  title: string
  emptyCopy: string
  drivers: DriverRow[]
  tone: 'own' | 'against'
}) {
  const allWithheld = drivers.length > 0 && drivers.every((d) => !d.reportable)
  const showEmpty = drivers.length === 0 || allWithheld
  const withheldSeed = drivers.find(() => true)

  return (
    <div style={{ minWidth: 0 }}>
      <h3
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          margin: '0 0 12px',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {drivers.map((d) => (
            <div key={d.driver}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
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
                <ShareBar share={d.share ?? 0} tone={tone} />
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
  notes,
}: {
  drivers: ChoiceDrivers | null
  notes: string[]
}) {
  const won = drivers?.by_outcome?.focal_won ?? []
  const lost = drivers?.by_outcome?.focal_lost ?? []

  return (
    <SectionShell
      id={REPORT_SECTIONS[1].id}
      number={2}
      title={REPORT_SECTIONS[1].title}
      sub={drivers?.interpretation ?? undefined}
      notes={notes}
    >
      <div className="deck-drivers-grid" style={{ display: 'grid', gap: 24 }}>
        <DriverColumn
          title="When they chose you"
          emptyCopy="Not enough decisive wins to break down yet."
          drivers={won}
          tone="own"
        />
        <DriverColumn
          title="When they chose against you"
          emptyCopy="Not enough decisive losses to break down yet."
          drivers={lost}
          tone="against"
        />
      </div>
    </SectionShell>
  )
}

function DeckAttributeImportance({
  data,
  notes,
}: {
  data: AttributeImportance | null
  notes: string[]
}) {
  const attrs = data?.attributes ?? []

  return (
    <SectionShell
      id={REPORT_SECTIONS[3].id}
      number={4}
      title={REPORT_SECTIONS[3].title}
      sub={data?.interpretation ?? 'Best-minus-worst importance — compelling vs objectionable.'}
      notes={notes}
    >
      {attrs.length === 0 ? (
        <SectionEmpty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="bipolar-labels" style={{ marginBottom: 4 }}>
            <span>Objectionable</span>
            <span>Compelling</span>
          </div>
          {attrs.map((a) => {
            const score = a.bw_score
            const nearZero = score != null && Math.abs(score) < 0.05

            return (
              <div key={a.attribute}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{a.attribute}</span>
                  {a.reportable && score != null ? (
                    <span
                      style={{
                        color:
                          nearZero
                            ? 'var(--ink-muted)'
                            : score < 0
                              ? 'var(--clay)'
                              : 'var(--sage-dark)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {score > 0 ? '+' : ''}
                      {score.toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <WithheldMetric metric={a}>
                  <BipolarTrack
                    score={score}
                    ciLow={a.bw_ci_low}
                    ciHigh={a.bw_ci_high}
                  />
                </WithheldMetric>
              </div>
            )
          })}
        </div>
      )}
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

function DeckLoyalty({ data, notes }: { data: RepurchaseIntent | null; notes: string[] }) {
  const bySession = new Map<number, RepurchaseSessionMetric[]>()
  for (const row of data?.by_session ?? []) {
    const list = bySession.get(row.session_number) ?? []
    list.push(row)
    bySession.set(row.session_number, list)
  }
  const sessions = [...bySession.keys()].sort((a, b) => a - b)

  return (
    <SectionShell
      id={REPORT_SECTIONS[4].id}
      number={5}
      title={REPORT_SECTIONS[4].title}
      sub={
        data?.interpretation ??
        'Full yes / no / yes+maybe set — top-two-box is never shown alone.'
      }
      notes={notes}
    >
      {sessions.length === 0 ? (
        <SectionEmpty />
      ) : (
        sessions.map((session) => {
          const rows = bySession.get(session) ?? []
          const ordered = [...rows].sort((a, b) => {
            const ia = REPURCHASE_ORDER.indexOf(a.metric as (typeof REPURCHASE_ORDER)[number])
            const ib = REPURCHASE_ORDER.indexOf(b.metric as (typeof REPURCHASE_ORDER)[number])
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
          })
          const set =
            ordered.length === 1 && ordered[0]?.metric === 'top_two_box' ? ordered : ordered

          return (
            <div key={session} style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  marginBottom: 12,
                }}
              >
                Session {session}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.max(set.length, 1)}, minmax(0, 1fr))`,
                  gap: 12,
                }}
              >
                {set.map((row) => (
                  <div
                    key={`${session}-${row.metric}`}
                    style={{
                      padding: 12,
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
                        marginBottom: 8,
                      }}
                    >
                      {repurchaseMetricLabel(row.metric)}
                    </div>
                    <WithheldMetric metric={row}>
                      <div
                        className={
                          row.metric === 'definite_yes'
                            ? 'loyalty-numeral--own'
                            : row.metric === 'no'
                              ? 'loyalty-numeral--against'
                              : 'loyalty-numeral--neutral'
                        }
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 32,
                          lineHeight: 1,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {row.rate != null ? formatPct01(row.rate) : '—'}
                      </div>
                      {row.ci_low != null && row.ci_high != null ? (
                        <p className="report-footnote" style={{ margin: '8px 0 0' }}>
                          Likely {formatPct01(row.ci_low)}–{formatPct01(row.ci_high)}
                        </p>
                      ) : null}
                    </WithheldMetric>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </SectionShell>
  )
}

function DeckLift({ lift, notes }: { lift: ExperienceLift | null; notes: string[] }) {
  const sub = 'Organic preference drift after claiming — associational, not causal.'

  if (lift == null) {
    return (
      <SectionShell
        id={REPORT_SECTIONS[6].id}
        number={7}
        title={REPORT_SECTIONS[6].title}
        sub={sub}
        notes={notes}
      >
        <SectionEmpty />
      </SectionShell>
    )
  }

  const warning =
    lift.confound_warning?.trim() ||
    'Associational longitudinal signal — not evidence that the study caused preference change.'

  return (
    <SectionShell
      id={REPORT_SECTIONS[6].id}
      number={7}
      title={REPORT_SECTIONS[6].title}
      sub={sub}
      notes={notes}
    >
      {!lift.reportable ? (
        <div>
          <SectionEmpty reason={lift.withheld_reason} />
          {lift.n_users_no_baseline != null && lift.n_users_no_baseline > 0 ? (
            <p className="report-body" style={{ margin: '8px 0 0' }}>
              {lift.n_users_no_baseline} respondents had no prior baseline preference history to
              measure drift against
              {lift.n_users_with_baseline != null
                ? ` · ${lift.n_users_with_baseline} with baseline`
                : ''}
              .
            </p>
          ) : null}
          <QuietNote>{warning}</QuietNote>
        </div>
      ) : (
        <>
      <div
        role="note"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          lineHeight: 1.55,
          color: 'var(--text-warning)',
          background: 'var(--bg-warning)',
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 16,
          border: '1px solid rgba(138, 75, 15, 0.2)',
        }}
      >
        {warning}
      </div>
        <div>
          <div
            className={
              lift.mean_elo_delta == null || lift.mean_elo_delta === 0
                ? 'lift-numeral--neutral'
                : lift.mean_elo_delta > 0
                  ? 'lift-numeral--own'
                  : 'lift-numeral--against'
            }
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 48,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {lift.mean_elo_delta != null
              ? `${lift.mean_elo_delta > 0 ? '+' : ''}${lift.mean_elo_delta.toFixed(1)}`
              : '—'}
          </div>
          <p className="report-body" style={{ margin: '10px 0 0' }}>
            Mean Elo delta
            {lift.ci_low != null && lift.ci_high != null
              ? ` · likely ${lift.ci_low.toFixed(1)} to ${lift.ci_high.toFixed(1)}`
              : ''}
          </p>
          <p className="report-footnote" style={{ margin: '8px 0 0' }}>
            {[
              lift.n_moved_up != null ? `${lift.n_moved_up} up` : null,
              lift.n_moved_down != null ? `${lift.n_moved_down} down` : null,
              lift.n_unchanged != null ? `${lift.n_unchanged} unchanged` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        </>
      )}
    </SectionShell>
  )
}

function DeckRankValidation({
  data,
  notes,
}: {
  data: RankValidation | null
  notes: string[]
}) {
  const order = (c: string) => (c === 'battled' ? 0 : c === 'inferred' ? 1 : 2)
  const rows = [...(data?.by_pair_class ?? [])].sort(
    (a, b) => order(String(a.pair_class)) - order(String(b.pair_class))
  )

  return (
    <SectionShell
      id={REPORT_SECTIONS[5].id}
      number={6}
      title={REPORT_SECTIONS[5].title}
      sub={data?.interpretation ?? undefined}
      notes={notes}
    >
      {rows.length === 0 ? (
        <SectionEmpty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
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
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    margin: '0 0 8px',
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
                      color: 'var(--ink)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row.agreement_rate != null ? formatPct01(row.agreement_rate) : '—'}
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--ink-muted)',
                        marginLeft: 8,
                      }}
                    >
                      agreement
                    </span>
                  </div>
                  {row.ci_low != null && row.ci_high != null ? (
                    <p className="report-footnote" style={{ margin: '8px 0 0' }}>
                      Likely {formatPct01(row.ci_low)}–{formatPct01(row.ci_high)}
                    </p>
                  ) : null}
                  <p className="report-footnote" style={{ margin: '6px 0 0' }}>
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
      )}
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

function DeckTrust({
  envelope,
  sectionNotes,
}: {
  envelope: ExperiencedReportEnvelope
  sectionNotes: SectionMethodNotes[]
}) {
  const { report } = envelope
  const rel = report.reliability
  const evidence = report.evidence_composition
  const already = new Set(sectionNotes.flatMap((n) => n.texts))
  const prose = methodologyProse(report.methodology as Record<string, unknown> | null).filter(
    (p) => !already.has(p)
  )

  return (
    <section
      id="report-appendix"
      className="report-section report-appendix"
      style={{ paddingTop: 8 }}
    >
      <details className="deck-trust-details">
        <summary
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--sage-dark)',
            cursor: 'pointer',
            listStyle: 'none',
          }}
        >
          Methodology & exclusions
        </summary>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sectionNotes.length > 0 ? (
            <div className="report-appendix-notes">
              {sectionNotes.map((block) => (
                <div key={block.section}>
                  <h3>
                    {block.section} · {block.heading}
                  </h3>
                  {block.texts.map((t) => (
                    <p key={t.slice(0, 64)}>{t}</p>
                  ))}
                </div>
              ))}
              <div>
                <h3>Executive summary</h3>
                <p>{STRIP_CONFIDENCE_NOTE}</p>
              </div>
            </div>
          ) : (
            <div className="report-appendix-notes">
              <h3>Executive summary</h3>
              <p>{STRIP_CONFIDENCE_NOTE}</p>
            </div>
          )}

          {rel ? (
            <div>
              <h3>Test–retest reliability</h3>
              <WithheldMetric metric={rel}>
                <p className="report-body" style={{ color: 'var(--ink)', margin: 0 }}>
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
              <h3>How we know they consumed it</h3>
              {evidence.receipt_note ? <QuietNote>{evidence.receipt_note}</QuietNote> : null}
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
                    (g.evidence_split && evidence.grade_semantics[g.evidence_split]) || undefined
                  return (
                    <li key={key} className="report-body" style={{ color: 'var(--ink)' }}>
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
              <h3>Methodology</h3>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {prose.map((p) => (
                  <li key={p.slice(0, 48)} className="report-footnote" style={{ fontStyle: 'italic' }}>
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
          justifyContent: 'flex-end',
          gap: 12,
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid var(--mist)',
        }}
      >
        <div className="report-footnote" style={{ textAlign: 'right' }}>
          {formatSnapshotDate(envelope.snapshot_date ?? envelope.computed_at) ? (
            <div>
              Snapshot {formatSnapshotDate(envelope.snapshot_date ?? envelope.computed_at)}
            </div>
          ) : null}
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
  const sectionNotes = collectMethodNotes(envelope)

  return (
    <div className="experienced-report-deck concept-report-deck">
      {envelope.is_simulated === true ? <SimulatedDataBanner /> : null}

      <div className="experienced-report-frame">
        <ReportSectionRail />
        <div className="experienced-report-document">
          <DeckColdOpen envelope={envelope} backHref={backHref} />
          <ExecutiveSummaryStrip envelope={envelope} />

          <div className="report-row report-row--7-5">
            <div className="report-span-7">
              <DeckVerdict envelope={envelope} notes={notesFor(sectionNotes, 1)} />
            </div>
            <div className="report-span-5">
              <DeckDrivers drivers={report.choice_drivers} notes={notesFor(sectionNotes, 2)} />
            </div>
          </div>

          <div className="report-row report-row--2up">
            <div className="report-span-6">
              <DeckField
                rows={report.per_opponent}
                focalName={report.focal_product.name}
                notes={notesFor(sectionNotes, 3)}
              />
            </div>
            <div className="report-span-6">
              <DeckAttributeImportance
                data={report.attribute_importance}
                notes={notesFor(sectionNotes, 4)}
              />
            </div>
          </div>

          <div className="report-row report-row--2up">
            <div className="report-span-6">
              <DeckLoyalty data={report.repurchase_intent} notes={notesFor(sectionNotes, 5)} />
            </div>
            <div className="report-span-6">
              <DeckRankValidation data={report.rank_validation} notes={notesFor(sectionNotes, 6)} />
            </div>
          </div>

          <div className="report-row report-row--full">
            <div className="report-span-12">
              <DeckLift lift={report.experience_lift_vs_baseline} notes={notesFor(sectionNotes, 7)} />
            </div>
          </div>

          <div className="report-row report-row--full">
            <div className="report-span-12">
              <DeckTrust envelope={envelope} sectionNotes={sectionNotes} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
