'use client'

import { useState } from 'react'

const FIXED_EXPLAINER =
  "A blank or 'gathering signal' result means the sample is below our reporting threshold — it is never shown as zero. Intervals are 95% confidence."

export function MethodologyDisclosure({ disclosure }: { disclosure: string }) {
  const [open, setOpen] = useState(false)

  return (
    <section
      style={{
        borderTop: '1px solid var(--mist)',
        paddingTop: 'var(--space-3)',
        marginTop: 'var(--space-4)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink)',
          }}
        >
          How this is measured
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--ink-faint)',
            lineHeight: 1,
          }}
        >
          {open ? '−' : '+'}
        </span>
      </button>

      {open ? (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink)',
              lineHeight: 1.6,
              margin: '0 0 var(--space-2)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {disclosure}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--ink-muted)',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {FIXED_EXPLAINER}
          </p>
        </div>
      ) : null}
    </section>
  )
}
