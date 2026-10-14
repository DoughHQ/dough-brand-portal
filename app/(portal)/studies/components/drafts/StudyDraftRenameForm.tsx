import type { CSSProperties } from 'react'

const quietGhost: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-50)',
  padding: '8px 10px',
}

const quietPrimary: CSSProperties = {
  border: 'none',
  background: 'var(--sage)',
  color: 'var(--on-fill, #fff)',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 600,
  padding: '9px 14px',
  borderRadius: 8,
}

type Props = {
  value: string
  busy: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export default function StudyDraftRenameForm({
  value,
  busy,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void onSubmit()
      }}
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={busy}
        aria-label="Draft title"
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          fontWeight: 500,
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--mist, var(--ink-10))',
          color: 'var(--ink)',
          background: 'var(--surface-1)',
        }}
      />
      <button type="submit" disabled={busy || !value.trim()} style={quietPrimary}>
        Save
      </button>
      <button type="button" disabled={busy} onClick={onCancel} style={quietGhost}>
        Cancel
      </button>
    </form>
  )
}
