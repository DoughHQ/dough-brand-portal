'use client'

/**
 * Single-test concept report deck — leads with verdict[], never recomputes overall.
 */

import Link from 'next/link'
import type { ConceptTestReport, ConceptTestVerdictResult } from '@/lib/conceptReport/conceptTestTypes'

type Props = {
  report: ConceptTestReport
  backHref: string
}

function pct(n: number): string {
  return `${Math.round(n * 1000) / 10}%`
}

function resultLabel(r: ConceptTestVerdictResult): string {
  switch (r) {
    case 'cleared':
      return 'Cleared'
    case 'not_cleared':
      return 'Not cleared'
    case 'too_close_to_call':
      return 'Too close to call'
    case 'not_enough_responses':
      return 'Not enough responses'
    default:
      return String(r).replace(/_/g, ' ')
  }
}

function resultColor(r: ConceptTestVerdictResult): string {
  if (r === 'cleared') return 'var(--sage)'
  if (r === 'not_cleared') return 'var(--red)'
  if (r === 'not_enough_responses') return 'var(--ink-50)'
  return 'var(--amber, #b45309)'
}

function priceShareText(shareConservative: number, shareGenerous: number): string {
  if (Math.abs(shareConservative - shareGenerous) < 1e-9) {
    return pct(shareConservative)
  }
  return `${pct(shareConservative)}–${pct(shareGenerous)}`
}

function IntervalCard({
  title,
  lo,
  hi,
  bar,
  doughDefault,
  result,
  detail,
}: {
  title: string
  lo: number
  hi: number
  bar: number
  doughDefault: number
  result: ConceptTestVerdictResult
  detail?: string
}) {
  return (
    <div
      style={{
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-md)',
        padding: '14px 16px',
        background: 'var(--white)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-50)',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink-80)', marginBottom: 4 }}>
        {pct(lo)}–{pct(hi)}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-50)', marginBottom: 8 }}>
        Bar {pct(bar)} · Dough default {pct(doughDefault)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: resultColor(result) }}>
        {resultLabel(result)}
      </div>
      {detail ? (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.4 }}>
          {detail}
        </p>
      ) : null}
    </div>
  )
}

export function ConceptTestReportDeck({ report, backHref }: Props) {
  const methodEntries = report.method ? Object.entries(report.method) : []

  return (
    <div
      style={{
        maxWidth: 880,
        margin: '0 auto',
        padding: '32px 24px 80px',
        fontFamily: 'var(--font-sans)',
        background: 'var(--cream)',
        minHeight: '100vh',
      }}
    >
      <Link
        href={backHref}
        style={{ fontSize: 12, color: 'var(--ink-faint)', textDecoration: 'none' }}
      >
        ← Back to studies
      </Link>

      <header style={{ margin: '20px 0 32px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 400,
            margin: '0 0 8px',
            color: 'var(--ink)',
          }}
        >
          Concept test
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-50)' }}>
          {report.sample.n_started} started
          {report.benchmark ? ` · Benchmark: ${report.benchmark.name}` : ''}
        </p>
      </header>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-80)', margin: '0 0 16px' }}>
          Verdict
        </h2>
        {report.verdict.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--ink-50)' }}>No designs to judge yet.</p>
        ) : (
          report.verdict.map((v) => (
            <div key={v.ref} style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ink-80)' }}>
                  {v.name}
                </h3>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: resultColor(v.overall),
                  }}
                >
                  {resultLabel(v.overall)}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                <IntervalCard
                  title="Head to head"
                  lo={v.head_to_head.lo}
                  hi={v.head_to_head.hi}
                  bar={v.head_to_head.bar}
                  doughDefault={v.head_to_head.dough_default}
                  result={v.head_to_head.result}
                  detail={`${v.head_to_head.wins}–${v.head_to_head.losses} (${v.head_to_head.n_respondents} respondent${v.head_to_head.n_respondents === 1 ? '' : 's'})`}
                />
                <IntervalCard
                  title="Liking"
                  lo={v.liking.lo}
                  hi={v.liking.hi}
                  bar={v.liking.bar}
                  doughDefault={v.liking.dough_default}
                  result={v.liking.result}
                  detail={v.liking.mode.replace(/_/g, ' ')}
                />
                <IntervalCard
                  title="Price"
                  lo={v.price.lo}
                  hi={v.price.hi}
                  bar={v.price.bar}
                  doughDefault={v.price.dough_default}
                  result={v.price.result}
                  detail={`Share at $${v.price.anchor.toFixed(2)}: ${priceShareText(
                    v.price.share_conservative,
                    v.price.share_generous
                  )}`}
                />
              </div>
            </div>
          ))
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-80)', margin: '0 0 12px' }}>
          First look
        </h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {report.first_look.map((row) => (
            <div
              key={row.ref}
              style={{
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                padding: '14px 16px',
                background: 'var(--white)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--ink-80)', marginBottom: 4 }}>
                {row.name}
                {row.is_benchmark ? (
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--ink-50)' }}>
                    benchmark
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
                Top-two {pct(row.top_two.share)} ({pct(row.top_two.lo)}–{pct(row.top_two.hi)}) · n=
                {row.n}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-80)', margin: '0 0 12px' }}>
          What matters
        </h2>
        {report.what_matters?.note || (report.what_matters?.items.length ?? 0) === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.5 }}>
            {report.what_matters?.note ?? 'Not enough answers yet to score what matters.'}
          </p>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--ink-50)' }}>Drivers scored.</p>
        )}
      </section>

      {report.stated_vs_chosen ? (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-80)', margin: '0 0 12px' }}>
            Stated vs chosen
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-80)', margin: 0 }}>
            Top-pick agreement {pct(report.stated_vs_chosen.top_pick_agreement)} · Mean pair{' '}
            {pct(report.stated_vs_chosen.mean_pair_agreement)} · {report.stated_vs_chosen.n_rankings}{' '}
            rankings
          </p>
        </section>
      ) : null}

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-80)', margin: '0 0 12px' }}>
          Price
        </h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {report.price.map((row) => (
            <div
              key={row.ref}
              style={{
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                padding: '14px 16px',
                background: 'var(--white)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {row.name}
                {row.is_benchmark ? (
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--ink-50)' }}>
                    benchmark
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
                Modal {row.report.modal_band?.label ?? '—'}
                {row.report.rejection_rate != null
                  ? ` · Reject ${pct(row.report.rejection_rate)}`
                  : ''}
              </div>
            </div>
          ))}
        </div>
      </section>

      {report.brand_questions.length > 0 ? (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-80)', margin: '0 0 4px' }}>
            Brand questions
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ink-50)', margin: '0 0 12px' }}>
            Written by you
          </p>
          {report.brand_questions.map((q, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                padding: '14px 16px',
                background: 'var(--white)',
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{q.prompt}</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink-80)' }}>
                {q.options.map((o) => (
                  <li key={o.option}>
                    {o.option} — {o.n}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {report.open_text ? (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-80)', margin: '0 0 12px' }}>
            Open text
          </h2>
          {report.open_text.scrub_note ? (
            <p style={{ fontSize: 12, color: 'var(--ink-50)', margin: '0 0 12px' }}>
              {report.open_text.scrub_note}
            </p>
          ) : null}
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {report.open_text.answers.map((a, i) => (
              <li
                key={i}
                style={{
                  borderBottom: '1px solid var(--ink-10)',
                  padding: '12px 0',
                  fontSize: 14,
                  color: 'var(--ink-80)',
                  lineHeight: 1.45,
                }}
              >
                {a.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {methodEntries.length > 0 ? (
        <section style={{ marginTop: 48, borderTop: '1px solid var(--ink-10)', paddingTop: 24 }}>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-50)',
              margin: '0 0 16px',
            }}
          >
            Method
          </h2>
          <dl style={{ margin: 0 }}>
            {methodEntries.map(([k, v]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <dt
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--ink-50)',
                    marginBottom: 4,
                    textTransform: 'capitalize',
                  }}
                >
                  {k.replace(/_/g, ' ')}
                </dt>
                <dd style={{ margin: 0, fontSize: 13, color: 'var(--ink-80)', lineHeight: 1.5 }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  )
}
