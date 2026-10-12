import { inputBase } from '../conceptStyles'

export default function PackSizeOtherInput({
  packSize,
  setPackSize,
}: {
  packSize: string
  setPackSize: (next: string) => void
}) {
  return (
    <input
      className="cb-input"
      value={packSize}
      onChange={(e) => setPackSize(e.target.value)}
      placeholder="Describe the pack (e.g. club-size carton)"
      style={{ ...inputBase, maxWidth: 360, marginTop: 8 }}
      aria-label="Custom pack size"
      autoFocus
    />
  )
}
