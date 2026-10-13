export default function ConceptAudienceLocked({ reason }: { reason: string }) {
  return (
    <p
      role="status"
      style={{
        margin: '0 0 18px',
        fontSize: 13,
        color: 'var(--ink-50)',
        background: 'var(--surface-1)',
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-md)',
        padding: '10px 12px',
      }}
    >
      {reason}
    </p>
  )
}
