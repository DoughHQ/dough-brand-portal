import type {
  RepurchaseIntent,
  RepurchaseSessionMetric,
} from '@/lib/experiencedReport/types'
import { formatPct01 } from '@/lib/experiencedReport/withheldCopy'
import { WithheldMetric } from './WithheldMetric'
import { SectionShell } from './deckChrome'
import { REPORT_SECTIONS } from './reportSections'
import { SectionEmpty } from './legacyDeckShared'

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

export function LegacyLoyaltySection({
  data,
  notes,
}: {
  data: RepurchaseIntent | null
  notes: string[]
}) {
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
            const ia = REPURCHASE_ORDER.indexOf(
              a.metric as (typeof REPURCHASE_ORDER)[number],
            )
            const ib = REPURCHASE_ORDER.indexOf(
              b.metric as (typeof REPURCHASE_ORDER)[number],
            )
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
          })
          const set =
            ordered.length === 1 && ordered[0]?.metric === 'top_two_box'
              ? ordered
              : ordered

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
                        <p
                          className="report-footnote"
                          style={{ margin: '8px 0 0' }}
                        >
                          Likely {formatPct01(row.ci_low)}–
                          {formatPct01(row.ci_high)}
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
