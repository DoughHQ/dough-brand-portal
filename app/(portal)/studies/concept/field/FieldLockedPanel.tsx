export default function FieldLockedPanel({
  disabled,
  disabledReason,
}: {
  disabled?: boolean
  disabledReason?: string | null
}) {
  if (!disabled) return null
  return (
    <div className="cb-locked-panel" role="status">
      <strong>Choose a category to continue</strong>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, maxWidth: 420 }}>
        {disabledReason ??
          'We’ll unlock your product and competitors after you select a category above.'}
      </p>
    </div>
  )
}
