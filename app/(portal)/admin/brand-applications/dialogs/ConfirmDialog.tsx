import { DialogShell } from './DialogShell'
import { Footer } from './DialogFooter'

export function ConfirmDialog({
  title,
  body,
  primaryLabel,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  title: string
  body: string
  primaryLabel: string
  busy: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <DialogShell title={title} onClose={onClose} busy={busy}>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>{body}</p>
      {error ? (
        <p style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.45, marginTop: 8 }}>{error}</p>
      ) : null}
      <Footer
        busy={busy}
        primaryLabel={primaryLabel}
        onCancel={onClose}
        onPrimary={onConfirm}
      />
    </DialogShell>
  )
}
