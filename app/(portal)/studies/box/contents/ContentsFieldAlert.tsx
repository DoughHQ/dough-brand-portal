export default function ContentsFieldAlert({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p role="alert" style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--red)' }}>
      {error}
    </p>
  )
}
