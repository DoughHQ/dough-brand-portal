export function ApplicationQueueImpersonation({ impersonating }: { impersonating: boolean }) {
  if (!impersonating) return null
  return (
    <div
      style={{
        marginBottom: 16,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'var(--amber-pale, rgba(192,120,24,0.12))',
        color: 'var(--amber, #a66a14)',
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      Leave the brand workspace (stop impersonating) before reviewing applications.
    </div>
  )
}
