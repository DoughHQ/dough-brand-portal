import Link from 'next/link'

export default function NewStudyChooserIntro() {
  return (
    <>
      <Link
        href="/studies"
        style={{
          display: 'inline-block',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-muted, var(--ink-50))',
          textDecoration: 'none',
          marginBottom: 20,
        }}
      >
        ← Back to studies
      </Link>

      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 400,
            color: 'var(--heading)',
            marginBottom: 8,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          New study
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--ink-muted)',
            margin: '8px 0 0',
            lineHeight: 1.5,
          }}
        >
          What kind of study do you want to run?
        </p>
      </header>
    </>
  )
}
