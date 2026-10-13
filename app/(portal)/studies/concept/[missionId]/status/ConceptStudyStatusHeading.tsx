import Link from 'next/link'

export default function ConceptStudyStatusHeading({ live }: { live: boolean }) {
  return (
    <>
      <Link
        href="/studies"
        style={{ fontSize: 12, color: 'var(--ink-50)', textDecoration: 'none' }}
      >
        ← Studies
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 32,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '12px 0 8px',
          color: 'var(--heading)',
        }}
      >
        {live ? 'Your study is live' : 'Concept study'}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.5, margin: '0 0 20px' }}>
        {live
          ? 'Respondents can take it. The report appears once enough people finish.'
          : 'This study is not live. If it has an order, checkout is where it gets paid.'}
      </p>
    </>
  )
}
