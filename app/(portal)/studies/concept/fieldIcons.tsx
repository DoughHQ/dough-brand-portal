'use client'

/** Shared row affordances for Section 1 columns. Extracted verbatim — no visual change. */

export function DragHandle() {
  return (
    <span
      aria-hidden
      style={{
        color: 'var(--ink-30)',
        fontSize: 14,
        letterSpacing: 1,
        userSelect: 'none',
        lineHeight: 1,
        paddingTop: 2,
      }}
    >
      ⠿
    </span>
  )
}

export function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M4 4l.5 7a1 1 0 001 1h3a1 1 0 001-1L10 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
