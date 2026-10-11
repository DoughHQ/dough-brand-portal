import type { RankValidation } from '@/lib/experiencedReport/types'
import { formatPct01 } from '@/lib/experiencedReport/withheldCopy'
import { WithheldMetric } from './WithheldMetric'
import { SectionShell } from './deckChrome'
import { REPORT_SECTIONS } from './reportSections'
import { SectionEmpty } from './legacyDeckShared'

export function LegacyRankValidationSection({
  data,
  notes,
}: {
  data: RankValidation | null
  notes: string[]
}) {
  const order = (c: string) => (c === 'battled' ? 0 : c === 'inferred' ? 1 : 2)
  const rows = [...(data?.by_pair_class ?? [])].sort(
    (a, b) => order(String(a.pair_class)) - order(String(b.pair_class)),
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
                    {row.agreement_rate != null
                      ? formatPct01(row.agreement_rate)
                      : '—'}
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
                    <p
                      className="report-footnote"
                      style={{ margin: '8px 0 0' }}
                    >
                      Likely {formatPct01(row.ci_low)}–
                      {formatPct01(row.ci_high)}
                    </p>
                  ) : null}
                  <p className="report-footnote" style={{ margin: '6px 0 0' }}>
                    {[
                      row.n_agree != null ? `${row.n_agree} agree` : null,
                      row.n_disagree != null
                        ? `${row.n_disagree} disagree`
                        : null,
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
