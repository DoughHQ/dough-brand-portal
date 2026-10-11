import type { ReactNode } from 'react'
import type {
  AskedBlock,
  JourneyClosedLine,
} from '@/lib/concept/journeyAccordion'

export function ClosedLine({ line }: { line: JourneyClosedLine }) {
  if (line.kind === 'required') {
    return (
      <span className="cb-acc-summary is-required">
        <span className="cb-required-dot" aria-hidden="true" />
        <span className="cb-sr">Required</span>
      </span>
    )
  }
  if (line.kind === 'empty') return <span className="cb-acc-summary" />
  return <span className="cb-acc-summary">{line.text}</span>
}

export function AskedList({
  blocks,
  prompt = true,
}: {
  blocks: AskedBlock[]
  /** The header already says the question. The panel then shows only the choices. */
  prompt?: boolean
}) {
  if (blocks.length === 0) return null
  return (
    <div className="cb-acc-asked-list">
      {blocks.map((block, index) => (
        <div className="cb-acc-asked" key={`${block.prompt}-${index}`}>
          {prompt ? <p className="cb-acc-question">{block.prompt}</p> : null}
          {block.items.length > 0 ? (
            <ol className="cb-acc-options">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{item}</li>
              ))}
            </ol>
          ) : null}
          {block.blank ? <div className="cb-acc-blank" /> : null}
          {block.note ? <p className="cb-acc-note">{block.note}</p> : null}
        </div>
      ))}
    </div>
  )
}

export function AccordionRow({
  id,
  index,
  title,
  line,
  countLabel,
  open,
  mark = false,
  measures,
  onToggle,
  rowRef,
  children,
}: {
  id: string
  index: string | null
  title: string
  line: JourneyClosedLine
  countLabel: string | null
  open: boolean
  /** A setting the brand completes. Question rows leave this off. */
  mark?: boolean
  measures?: string
  onToggle: () => void
  rowRef: (node: HTMLElement | null) => void
  children?: ReactNode
}) {
  return (
    <section
      id={`journey-step-${id}`}
      ref={rowRef}
      className={`cb-acc${open ? ' is-open' : ''}`}
    >
      <h3 className="cb-acc-heading">
        <button
          type="button"
          className={`cb-acc-head${mark ? ' has-mark' : ''}`}
          aria-expanded={open}
          aria-controls={open ? `journey-step-panel-${id}` : undefined}
          onClick={onToggle}
        >
          <span className="cb-acc-index">{index ?? ''}</span>
          <span className="cb-acc-main">
            <span className="cb-acc-title">{title}</span>
            {open && line.kind === 'question' ? null : <ClosedLine line={line} />}
          </span>
          <span className="cb-acc-count">{countLabel ?? ''}</span>
          {mark ? (
            <span className="cb-acc-check" aria-label="Done">
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path
                  d="M3.5 8.2 6.4 11 12.5 4.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : null}
          <span className="cb-acc-chevron" aria-hidden="true" />
        </button>
      </h3>
      {open ? (
        <div className="cb-acc-body" id={`journey-step-panel-${id}`} role="region">
          {measures ? <p className="cb-acc-measures">{measures}</p> : null}
          {children}
        </div>
      ) : null}
    </section>
  )
}
