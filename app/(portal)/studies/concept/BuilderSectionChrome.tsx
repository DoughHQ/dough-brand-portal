'use client'

import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { sectionCard } from './conceptStyles'

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
  const [open, setOpen] = useState(!done)

  useEffect(() => {
    setOpen(!done)
  }, [done])

  useEffect(() => {
    const root = document.getElementById(id)
    if (!root) return
    function onExpand() {
      setOpen(true)
    }
    root.addEventListener('cb-expand-section', onExpand)
    return () => root.removeEventListener('cb-expand-section', onExpand)
  }, [id])

  return (
    <section
      id={id}
      className={['cb-builder-section', className].filter(Boolean).join(' ')}
      style={sectionCard}
      data-done={done ? 'true' : 'false'}
      data-open={open ? 'true' : 'false'}
    >
      <div className="cb-builder-section-head">
        <button
          type="button"
          className="cb-builder-section-toggle"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="cb-builder-section-titles">
            <span className="cb-builder-section-title">{title}</span>
            <span className="cb-builder-section-summary">{summary}</span>
          </span>
          <span className="cb-builder-section-chevron" aria-hidden>
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
              <path
                d={open ? 'M5 12.5 10 7.5 15 12.5' : 'M5 7.5 10 12.5 15 7.5'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
      {open ? (
        <div className="cb-builder-section-body" id={`${id}-body`}>
          {children}
        </div>
      ) : null}
    </section>
  )
}
