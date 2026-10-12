function StatusChip({
  ok,
  label,
  tone,
}: {
  ok: boolean
  label: string
  tone?: 'ok' | 'warn'
}) {
  const t = tone ?? (ok ? 'ok' : 'warn')
  const color = t === 'ok' ? 'var(--sage)' : 'var(--amber-warning)'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        color,
      }}
    >
      <span className="cb-field-status-icon" data-tone={t} aria-hidden>
        {ok ? '✓' : '!'}
      </span>
      {label}
    </span>
  )
}

export default function FieldCapacityStatus({
  disabled,
  showCapacity,
  fieldSizeOk,
  capacityText,
}: {
  disabled?: boolean
  showCapacity: boolean
  fieldSizeOk: boolean
  capacityText: string
}) {
  if (disabled || !showCapacity) return null
  return (
    <div className="cb-field-status" role="status">
      {fieldSizeOk ? (
        /* Plain text, not a pass: a full field is not the same as a valid study. */
        <span
          data-testid="field-capacity"
          style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-50)' }}
        >
          {capacityText}
        </span>
      ) : (
        <span data-testid="field-capacity">
          <StatusChip ok={false} tone="warn" label={capacityText} />
        </span>
      )}
    </div>
  )
}
