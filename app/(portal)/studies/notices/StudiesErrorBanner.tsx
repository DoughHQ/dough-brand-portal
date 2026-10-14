type Props = {
  message: string
}

export default function StudiesErrorBanner({ message }: Props) {
  return (
    <div
      role="alert"
      style={{
        marginBottom: 20,
        fontSize: 13,
        color: 'var(--ink)',
        background: 'var(--paper)',
        border: '1px solid var(--mist, var(--ink-10))',
        borderRadius: 'var(--r-md, 8px)',
        padding: '10px 14px',
      }}
    >
      {message}
    </div>
  )
}
