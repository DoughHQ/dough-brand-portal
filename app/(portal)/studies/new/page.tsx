'use client'

import Link from 'next/link'
import { useState, type CSSProperties, type ReactNode } from 'react'

const cardBase: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  background: 'var(--paper, var(--white))',
  border: '1px solid var(--mist, var(--ink-10))',
  borderRadius: 12,
  padding: '28px 24px',
  textDecoration: 'none',
  color: 'inherit',
  minHeight: 200,
  transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
}

function ChoiceCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      style={{
        ...cardBase,
        borderColor: hovered ? 'var(--sage)' : 'var(--mist, var(--ink-10))',
        background: hovered ? 'var(--sage-soft, var(--paper))' : 'var(--paper, var(--white))',
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
          color: 'var(--sage-dark)',
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

export default function NewStudyChooserPage() {
  return (
    <div
      style={{
        minHeight: '100%',
        background: 'var(--cream)',
        padding: 'var(--space-4, 32px) var(--space-3, 24px)',
      }}
    >
      <div
        style={{
          maxWidth: 820,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <Link
          href="/studies"
          style={{
            display: 'inline-block',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink-muted, var(--ink-50))',
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          ← Back to studies
        </Link>

        <header style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 400,
              color: 'var(--sage-dark)',
              marginBottom: 8,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            New study
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink-muted)',
              margin: '8px 0 0',
              lineHeight: 1.5,
            }}
          >
            What kind of study do you want to run?
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          <ChoiceCard
            href="/studies/concept/new"
            icon="◇"
            title="Concept test"
            description="Validate names, packaging, and claims before you ship a physical product."
          />
          <ChoiceCard
            href="/studies/box/new"
            icon="▣"
            title="iHUT study"
            description="Ship real products to qualified people and measure what they actually reach for."
          />
        </div>
      </div>
    </div>
  )
}
