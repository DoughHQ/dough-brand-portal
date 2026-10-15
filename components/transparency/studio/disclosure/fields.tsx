import type { ReactNode } from 'react'
import { formatProofCode } from '@/lib/transparency/displayMap'

export function Label({ children }: { children: ReactNode }) {
  return <div className="tx-label">{children}</div>
}

export function OptionSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="tx-control"
    >
      <option value="">{placeholder ?? 'Select…'}</option>
      {options.map((code) => (
        <option key={code} value={code}>
          {formatProofCode(code)}
        </option>
      ))}
    </select>
  )
}
