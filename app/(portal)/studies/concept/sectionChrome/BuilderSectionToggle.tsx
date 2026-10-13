import type { Dispatch, SetStateAction } from 'react'

export default function BuilderSectionToggle({
  id,
  title,
  summary,
  open,
  setOpen,
}: {
  id: string
  title: string
  summary: string
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}) {
  return (
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
  )
}
