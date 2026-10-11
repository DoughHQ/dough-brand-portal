import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import {
  formatPct01,
  formatSnapshotDate,
} from '@/lib/experiencedReport/withheldCopy'
import { STRIP_CONFIDENCE_NOTE } from '@/lib/experiencedReport/executiveSummary'
import { WithheldMetric } from './WithheldMetric'
import type { SectionMethodNotes } from './reportSections'
import { QuietNote } from './legacyDeckShared'

function methodologyProse(
  m: Record<string, unknown> | null | undefined,
): string[] {
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

export function LegacyTrustSection({
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
  const prose = methodologyProse(
    report.methodology as Record<string, unknown> | null,
  ).filter((p) => !already.has(p))

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
            color: 'var(--heading)',
            cursor: 'pointer',
            listStyle: 'none',
          }}
        >
          Methodology & exclusions
        </summary>

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
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
                <p
                  className="report-body"
                  style={{ color: 'var(--ink)', margin: 0 }}
                >
                  Consistency{' '}
                  {rel.consistency_rate != null
                    ? formatPct01(rel.consistency_rate)
                    : '—'}
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
                    (g.evidence_split &&
                      evidence.grade_semantics[g.evidence_split]) ||
                    undefined
                  return (
                    <li
                      key={key}
                      className="report-body"
                      style={{ color: 'var(--ink)' }}
                    >
                      <strong style={{ textTransform: 'capitalize' }}>
                        {(g.evidence_split ?? 'grade').replace(/_/g, ' ')}
                      </strong>
                      {semantics ? (
                        <span style={{ color: 'var(--ink-muted)' }}>
                          {' '}
                          — {semantics}
                        </span>
                      ) : null}
                      <div style={{ marginTop: 6 }}>
                        <WithheldMetric metric={g}>
                          <span style={{ color: 'var(--ink-muted)' }}>
                            {g.value != null ? formatPct01(g.value) : '—'}
                            {g.n_users != null ? ` · ${g.n_users} people` : ''}
                            {g.n_decisive != null
                              ? ` · ${g.n_decisive} decisive`
                              : ''}
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
                  <li
                    key={p.slice(0, 48)}
                    className="report-footnote"
                    style={{ fontStyle: 'italic' }}
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
          justifyContent: 'flex-end',
          gap: 12,
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid var(--mist)',
        }}
      >
        <div className="report-footnote" style={{ textAlign: 'right' }}>
          {formatSnapshotDate(
            envelope.snapshot_date ?? envelope.computed_at,
          ) ? (
            <div>
              Snapshot{' '}
              {formatSnapshotDate(
                envelope.snapshot_date ?? envelope.computed_at,
              )}
            </div>
          ) : null}
        </div>
      </footer>
    </section>
  )
}
