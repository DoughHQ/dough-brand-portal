export default function ContentsReadinessNote({ readiness }: { readiness: string | null }) {
  if (!readiness) return null
  return (
    <p
      role="status"
      style={{
        margin: '0 0 16px',
        padding: '8px 12px',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--ink-10)',
        background: 'var(--surface-1)',
        fontSize: 12,
        color: 'var(--ink-70)',
        maxWidth: 640,
      }}
    >
      {readiness}
    </p>
  )
}
