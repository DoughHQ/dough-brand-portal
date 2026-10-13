'use client'

import type { ReactNode } from 'react'
import { sectionCard } from './conceptStyles'
import BuilderSectionToggle from './sectionChrome/BuilderSectionToggle'
import { useBuilderSectionChrome } from './sectionChrome/useBuilderSectionChrome'

type Props = {
  id: string
  title: string
  summary: string
  /** When true, the section collapses once (and re-opens if it becomes incomplete). */
  done: boolean
  className?: string
  children: ReactNode
}

/**
 * Concept builder top-level section: title + live summary, body collapses when done.
 * Dock scroll targets dispatch `cb-expand-section` on this element to open it.
 */
export default function BuilderSectionChrome({
  id,
  title,
  summary,
  done,
  className,
  children,
}: Props) {
  const chrome = useBuilderSectionChrome(id, done)

  return (
    <section
      id={id}
      className={['cb-builder-section', className].filter(Boolean).join(' ')}
      style={sectionCard}
      data-done={done ? 'true' : 'false'}
      data-open={chrome.open ? 'true' : 'false'}
    >
      <BuilderSectionToggle
        id={id}
        title={title}
        summary={summary}
        open={chrome.open}
        setOpen={chrome.setOpen}
      />
      {chrome.open ? (
        <div className="cb-builder-section-body" id={`${id}-body`}>
          {children}
        </div>
      ) : null}
    </section>
  )
}
