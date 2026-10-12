export default function PrototypePickError({ message }: { message: string }) {
  return (
    <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>
      {message}
    </p>
  )
}
