import Link from 'next/link'

type Props = {
  params: Promise<{ missionId: string }>
  searchParams: Promise<{ published?: string }>
}

/** Post-publish status — report memo at /report when frozen snapshot exists. */
export default async function ConceptStudyStatusPage({ params, searchParams }: Props) {
  const { missionId } = await params
  const sp = await searchParams
  const justPublished = sp.published === '1'
  const reportHref = `/studies/concept/${missionId}/report`

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 640,
        margin: '0 auto',
        padding: '64px 28px',
      }}
    >
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
        }}
      >
        {justPublished ? 'Study published' : 'Concept study'}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.5, margin: '0 0 20px' }}>
        Mission <code style={{ fontSize: 12 }}>{missionId}</code> is live. The report memo
        appears once enough people complete — manage close / withdraw from Studies.
      </p>
      {justPublished ? (
        <div
          role="status"
          style={{
            fontSize: 13,
            color: 'var(--sage-dark)',
            background: 'var(--sage-soft)',
            border: '1px solid rgba(62, 107, 74, 0.2)',
            borderRadius: 'var(--r-md)',
            padding: '10px 14px',
            marginBottom: 20,
          }}
        >
          Study published
        </div>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Link
          href={reportHref}
          style={{
            display: 'inline-block',
            background: 'var(--sage)',
            color: 'var(--white)',
            fontSize: 13,
            fontWeight: 600,
            padding: '10px 18px',
            borderRadius: 'var(--r-sm)',
            textDecoration: 'none',
          }}
        >
          View report
        </Link>
        <Link
          href="/studies"
          style={{
            display: 'inline-block',
            background: 'var(--paper)',
            color: 'var(--sage-dark)',
            border: '1px solid var(--mist)',
            fontSize: 13,
            fontWeight: 500,
            padding: '10px 18px',
            borderRadius: 'var(--r-sm)',
            textDecoration: 'none',
          }}
        >
          Back to studies
        </Link>
      </div>
    </div>
  )
}
