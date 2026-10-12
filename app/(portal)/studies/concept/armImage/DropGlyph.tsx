export default function DropGlyph({ active, large }: { active: boolean; large?: boolean }) {
  const size = large ? 52 : 36
  const icon = large ? 24 : 18
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: large ? 'var(--cb-radius-pill)' : 'var(--cb-radius-media)',
        background: active ? 'var(--cb-sage-soft)' : 'var(--cb-sage-hover)',
        color: 'var(--cb-sage)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 120ms ease, color 120ms ease',
      }}
    >
      <svg width={icon} height={icon} viewBox="0 0 18 18" fill="none">
        <path
          d="M9 12.5V3.5M9 3.5L5.5 7M9 3.5L12.5 7M3.5 12.5v1a1.5 1.5 0 001.5 1.5h8a1.5 1.5 0 001.5-1.5v-1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
