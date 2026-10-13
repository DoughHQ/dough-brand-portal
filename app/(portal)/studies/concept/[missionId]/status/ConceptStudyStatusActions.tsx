import Link from 'next/link'

type Props = {
  live: boolean
  reportHref: string
}

export default function ConceptStudyStatusActions({ live, reportHref }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {live ? (
        <Link
          href={reportHref}
          style={{
            display: 'inline-block',
            background: 'var(--sage)',
            color: 'var(--on-fill)',
            fontSize: 13,
            fontWeight: 600,
            padding: '10px 18px',
            borderRadius: 'var(--r-sm)',
            textDecoration: 'none',
          }}
        >
          View report
        </Link>
      ) : null}
      <Link
        href="/studies"
        style={{
          display: 'inline-block',
          background: 'var(--paper)',
          color: 'var(--heading)',
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
  )
}
