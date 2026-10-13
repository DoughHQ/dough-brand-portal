export type ConfirmRequest = {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
}
