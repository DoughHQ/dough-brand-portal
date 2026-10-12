export default function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        width: 16,
        height: 16,
        borderRadius: 'var(--cb-radius-pill)',
        border: '2px solid var(--ink-10)',
        borderTopColor: 'var(--cb-sage)',
        animation: 'concept-spin 0.7s linear infinite',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}
