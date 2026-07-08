'use client'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--r-sm)',
  border: '1px solid var(--ink-10)',
  background: 'var(--surface)',
  fontSize: 13,
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  transition: 'border-color 0.12s',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 6,
  letterSpacing: '0.04em',
}

export function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  onKeyDown,
  autoComplete,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  autoComplete?: string
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete}
        style={inputStyle}
        onFocus={(e) => { e.target.style.borderColor = 'var(--ink-30)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--ink-10)' }}
      />
    </div>
  )
}

export function AuthPrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '12px',
        background: disabled ? 'var(--ink-10)' : 'var(--sage)',
        color: disabled ? 'var(--ink-30)' : 'white',
        borderRadius: 'var(--r-sm)',
        fontSize: 13,
        fontWeight: 500,
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-sans)',
        transition: 'background 0.12s',
        marginTop: 4,
      }}
    >
      {children}
    </button>
  )
}

export function AuthTextButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12,
        color: 'var(--ink-30)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {children}
    </button>
  )
}

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface)',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 28,
            fontWeight: 500,
            color: 'var(--sage)',
            letterSpacing: '-0.5px',
          }}
        >
          dough<span style={{ color: 'var(--ink-30)', fontWeight: 400 }}>.</span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginTop: 4,
          }}
        >
          Brand Intelligence
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-xl)',
          padding: '36px 40px',
        }}
      >
        {children}
      </div>

      <div style={{ marginTop: 32, fontSize: 11, color: 'var(--ink-30)', textAlign: 'center' }}>
        godough.co · hello@godough.co
      </div>
    </div>
  )
}
