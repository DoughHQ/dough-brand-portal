type Props = {
  busy?: boolean
  onResume: () => void
  onStartFresh: () => void
}

export default function ResumeDraftActions({ busy, onResume, onStartFresh }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <button
        type="button"
        disabled={busy}
        onClick={onStartFresh}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: busy ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-50)',
          padding: '8px 10px',
          opacity: busy ? 0.5 : 1,
        }}
      >
        Start fresh
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onResume}
        style={{
          border: 'none',
          background: 'var(--sage)',
          color: 'var(--on-fill, #fff)',
          cursor: busy ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 600,
          padding: '9px 14px',
          borderRadius: 8,
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? 'Loading…' : 'Resume'}
      </button>
    </div>
  )
}
