'use client'

import { useEffect } from 'react'
import Link from 'next/link'

type PortalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PortalError({ error, reset }: PortalErrorProps) {
  useEffect(() => {
    console.error('[portal] Unhandled route error', error)
  }, [error])

  return (
    <main
      style={{
        display: 'grid',
        minHeight: 'min(560px, 70vh)',
        padding: 'clamp(24px, 6vw, 72px)',
        placeItems: 'center',
      }}
    >
      <section
        aria-labelledby="portal-error-title"
        role="alert"
        style={{
          width: 'min(100%, 520px)',
          padding: 'clamp(28px, 5vw, 48px)',
          textAlign: 'center',
          background: 'var(--surface-1)',
          border: '1px solid var(--mist)',
          borderRadius: 'var(--radius-panel, 14px)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <p
          style={{
            marginBottom: 12,
            color: 'var(--sage)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Something went wrong
        </p>
        <h1
          id="portal-error-title"
          style={{
            marginBottom: 12,
            color: 'var(--ink)',
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          We couldn&apos;t load this page
        </h1>
        <p
          style={{
            maxWidth: 400,
            margin: '0 auto 28px',
            color: 'var(--ink-50)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Try loading the page again. If the problem continues, return to your dashboard.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 42,
              padding: '10px 18px',
              color: 'var(--on-fill, #faf8f3)',
              fontWeight: 700,
              background: 'var(--sage)',
              borderRadius: 10,
            }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 42,
              padding: '10px 18px',
              color: 'var(--ink)',
              fontWeight: 700,
              border: '1px solid var(--mist)',
              borderRadius: 10,
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}
