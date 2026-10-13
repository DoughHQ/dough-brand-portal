type Props = {
  name: string
  onConfirm: () => void
  onChange: () => void
}

export default function ProductIdentityActions({ name, onConfirm, onChange }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
      <button
        type="button"
        className="cb-btn cb-btn-secondary"
        onClick={onConfirm}
        aria-label={`Confirm ${name}`}
      >
        Confirm
      </button>
      <button type="button" className="cb-quiet-action" onClick={onChange}>
        Not this one
      </button>
    </div>
  )
}
