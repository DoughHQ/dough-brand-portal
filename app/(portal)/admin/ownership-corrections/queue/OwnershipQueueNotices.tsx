export function OwnershipQueueNotices({
  flash,
  error,
}: {
  flash: string | null
  error: string | null
}) {
  return (
    <>
      {flash ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--sage-soft, rgba(74, 103, 65, 0.12))',
            color: 'var(--heading)',
            fontSize: 13,
          }}
        >
          {flash}
        </div>
      ) : null}

      {error ? (
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
      ) : null}
    </>
  )
}
