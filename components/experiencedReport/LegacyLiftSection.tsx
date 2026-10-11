import type { ExperienceLift } from '@/lib/experiencedReport/types'
import { SectionShell } from './deckChrome'
import { REPORT_SECTIONS } from './reportSections'
import { QuietNote, SectionEmpty } from './legacyDeckShared'

export function LegacyLiftSection({
  lift,
  notes,
}: {
  lift: ExperienceLift | null
  notes: string[]
}) {
  const sub =
    'Organic preference drift after claiming — associational, not causal.'

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
              {lift.n_users_no_baseline} respondents had no prior baseline
              preference history to measure drift against
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
                lift.n_unchanged != null
                  ? `${lift.n_unchanged} unchanged`
                  : null,
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
