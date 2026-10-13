import Link from 'next/link'
import { useState, type CSSProperties, type ReactNode } from 'react'

const cardBase: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  background: 'var(--paper)',
  border: '1px solid var(--mist, var(--ink-10))',
  borderRadius: 12,
  padding: '28px 24px',
  textDecoration: 'none',
  color: 'inherit',
  minHeight: 200,
  transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
}

type Props = {
  href: string
  icon: ReactNode
  title: string
  description: string
}

export default function StudyChoiceCard({ href, icon, title, description }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      style={{
        ...cardBase,
        borderColor: hovered ? 'var(--sage)' : 'var(--mist, var(--ink-10))',
        background: hovered ? 'var(--sage-soft, var(--paper))' : 'var(--paper)',
        boxShadow: hovered ? '0 4px 16px rgba(36, 61, 44, 0.06)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        aria-hidden
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          background: 'var(--sage-soft, var(--sage-pale))',
          color: 'var(--heading)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 18,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: 8,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--ink-muted, var(--ink-50))',
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>
      <div
        style={{
          marginTop: 'auto',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--sage)',
        }}
      >
        Continue →
      </div>
    </Link>
  )
}
