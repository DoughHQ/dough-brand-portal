'use client'

import type { QuestionResponse } from '@/lib/conceptReport/types'

function shareEntries(q: QuestionResponse): { option: string; share: number; count: number }[] {
  const shares = q.aggregate.shares
  const dist = q.aggregate.distribution
  const keys = new Set([...Object.keys(shares), ...Object.keys(dist)])
  const rows = [...keys].map((option) => {
    const shareRaw = shares[option]
    const count = dist[option] ?? 0
    // shares may be 0–1 or already percent; normalize display only
    const share =
      shareRaw == null
        ? q.aggregate.n_answers && q.aggregate.n_answers > 0
          ? count / q.aggregate.n_answers
          : 0
        : shareRaw > 1
          ? shareRaw / 100
          : shareRaw
    return { option, share, count }
  })
  return rows.sort((a, b) => b.share - a.share)
}

function formatSharePct(share: number): string {
  return `${Math.round(share * 100)}%`
}

function CategoricalBars({ q }: { q: QuestionResponse }) {
  const rows = shareEntries(q)
  const n = q.aggregate.n_answers
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row) => (
        <div key={row.option}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 4,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
            }}
          >
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{row.option}</span>
            <span style={{ color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
              {formatSharePct(row.share)}
              {n != null ? ` · ${row.count} of ${n}` : row.count > 0 ? ` · ${row.count}` : ''}
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 2,
              background: 'var(--surface-1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, row.share * 100))}%`,
                height: '100%',
                background: 'var(--sage)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const INTENT_TONES: Record<string, string> = {
  yes: 'var(--sage)',
  maybe: 'var(--amber)',
  no: 'var(--ink-faint)',
}

function IntentStack({ q }: { q: QuestionResponse }) {
  const rows = shareEntries(q)
  // Prefer yes → maybe → no order when present; else keep share desc
  const order = ['yes', 'maybe', 'no']
  const ordered = [...rows].sort((a, b) => {
    const ia = order.indexOf(a.option.toLowerCase())
    const ib = order.indexOf(b.option.toLowerCase())
    if (ia === -1 && ib === -1) return b.share - a.share
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          height: 28,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'var(--surface-1)',
        }}
        role="img"
        aria-label={ordered.map((r) => `${r.option} ${formatSharePct(r.share)}`).join(', ')}
      >
        {ordered.map((row) => (
          <div
            key={row.option}
            style={{
              width: `${Math.max(0, Math.min(100, row.share * 100))}%`,
              background: INTENT_TONES[row.option.toLowerCase()] ?? 'var(--mist)',
              minWidth: row.share > 0 ? 2 : 0,
            }}
            title={`${row.option}: ${formatSharePct(row.share)}`}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 16px',
          marginTop: 10,
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--ink-muted)',
        }}
      >
        {ordered.map((row) => (
          <span key={row.option}>
            <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{row.option}</span>{' '}
            {formatSharePct(row.share)}
            {q.aggregate.n_answers != null
              ? ` · ${row.count} of ${q.aggregate.n_answers}`
              : ''}
          </span>
        ))}
      </div>
      {q.aggregate.presentation_rule ? (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
          }}
        >
          {q.aggregate.presentation_rule}
        </p>
      ) : null}
    </div>
  )
}

function QuestionCard({ q, screening }: { q: QuestionResponse; screening?: boolean }) {
  const kind = q.signal_kind
  const sub =
    q.framing_note ||
    (kind === 'screening_context'
      ? 'This describes your respondents, not a result about the product.'
      : null)

  return (
    <div
      style={{
        padding: screening ? '16px 18px' : '20px 22px',
        borderRadius: 10,
        border: screening ? '1px dashed var(--mist)' : '1px solid var(--mist)',
        background: screening ? 'var(--surface-1)' : 'var(--paper)',
      }}
    >
      {screening ? (
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            margin: '0 0 8px',
          }}
        >
          Who answered
        </p>
      ) : null}
      <h3
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: screening ? 14 : 15,
          fontWeight: 600,
          color: 'var(--ink)',
          margin: '0 0 6px',
          lineHeight: 1.35,
        }}
      >
        {q.prompt}
      </h3>
      {sub ? (
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.45,
            color: 'var(--ink-muted)',
            margin: '0 0 14px',
          }}
        >
          {sub}
        </p>
      ) : (
        <div style={{ height: 10 }} />
      )}
      {kind === 'intent_scale' ? (
        <IntentStack q={q} />
      ) : (
        <CategoricalBars q={q} />
      )}
    </div>
  )
}

export function DeckQuestions({
  questions,
  thin,
}: {
  questions: QuestionResponse[]
  thin: boolean
}) {
  if (questions.length === 0) return null

  return (
    <section
      style={{
        maxWidth: 920,
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
          color: 'var(--ink)',
        }}
      >
        What respondents told you
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--ink-muted)',
          margin: '0 0 8px',
          lineHeight: 1.5,
        }}
      >
        Every question in your study, answered.
      </p>
      {thin ? (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--amber)',
            margin: '0 0 24px',
          }}
        >
          Directional — same thin sample as above.
        </p>
      ) : (
        <div style={{ height: 16 }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {questions.map((q, i) => (
          <QuestionCard
            key={`${q.question_type_code}-${q.position ?? i}-${q.prompt}`}
            q={q}
            screening={q.signal_kind === 'screening_context'}
          />
        ))}
      </div>
    </section>
  )
}
