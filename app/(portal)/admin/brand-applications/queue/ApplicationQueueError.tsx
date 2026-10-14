export function ApplicationQueueError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div
      style={{
        marginBottom: 16,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(180, 35, 24, 0.08)',
        color: 'var(--red, #b42318)',
        fontSize: 13,
      }}
    >
      {error}
    </div>
  )
}
