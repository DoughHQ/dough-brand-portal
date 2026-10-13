import Link from 'next/link'

type Props = {
  title: string
  body: string
  backHref: string
}

export default function ConceptReportStateCard({ title, body, backHref }: Props) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '64px 28px',
        fontFamily: 'var(--font-sans)',
        background: 'var(--surface)',
        minHeight: '100vh',
      }}
    >
      <Link
        href={backHref}
        style={{
          fontSize: 12,
          color: 'var(--ink-faint)',
          textDecoration: 'none',
        }}
      >
        ← Back to studies
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 400,
          margin: '16px 0 12px',
          color: 'var(--ink)',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--ink-muted)',
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  )
}
