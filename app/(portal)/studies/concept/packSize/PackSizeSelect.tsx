import {
  PACK_SIZE_OTHER,
  packSizeDisplayLabel,
  type PackSizeOption,
} from '@/lib/concept/packSize'
import { inputBase, labelSm } from '../conceptStyles'

function RequiredDot() {
  return <span aria-hidden className="cb-required-dot" />
}

export default function PackSizeSelect({
  packSize,
  disabled,
  loading,
  selectValue,
  options,
  onSelectChange,
}: {
  packSize: string
  disabled: boolean
  loading: boolean
  selectValue: string
  options: PackSizeOption[]
  onSelectChange: (value: string) => void
}) {
  return (
    <>
      <label style={labelSm} htmlFor="pack_size_s0">
        {!packSize.trim() ? <RequiredDot /> : null}
        Pack size
      </label>

      <select
        id="pack_size_s0"
        className="cb-input"
        value={disabled ? '' : selectValue}
        disabled={disabled || loading}
        onChange={(e) => onSelectChange(e.target.value)}
        style={{ ...inputBase, maxWidth: 360 }}
        aria-describedby="pack_size_hint pack_size_preview"
      >
        <option value="" disabled>
          {disabled
            ? 'Pick a category first'
            : loading
              ? 'Loading pack sizes…'
              : 'Select pack size'}
        </option>
        {options.map((o) => (
          <option key={o.phrase} value={o.phrase}>
            {packSizeDisplayLabel(o.phrase)}
          </option>
        ))}
        {!disabled ? <option value={PACK_SIZE_OTHER}>Other…</option> : null}
      </select>
    </>
  )
}
