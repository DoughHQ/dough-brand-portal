'use client'

import { useEffect, useState } from 'react'

export type BuilderStep = {
  id: string
  label: string
  done: boolean
}

/**
 * Numbered section bar. Each step is a real link to that section's id.
 * The fill tracks completed steps. The highlighted step is the one in view.
 */
export default function BuilderStepper({
  steps,
  label,
}: {
  steps: BuilderStep[]
  label: string
}) {
  const ids = steps.map((step) => step.id).join('|')
  const [inView, setInView] = useState<string | null>(null)

  useEffect(() => {
    const elements = ids
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null)
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const next = elements.find((el) => visible.has(el.id))
        setInView(next ? next.id : null)
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: [0, 0.15, 0.4] }
    )
    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [ids])

  const fallback = steps.findIndex((step) => !step.done)
  const viewed = inView ? steps.findIndex((step) => step.id === inView) : -1
  const activeIndex = viewed >= 0 ? viewed : fallback
  const doneCount = steps.filter((step) => step.done).length
  const progress =
    steps.length <= 1 ? 1 : Math.min(1, doneCount / (steps.length - 1))

  return (
    <nav className="cb-stepper" aria-label={label}>
      <ol
        className="cb-stepper-list"
        style={{
          ['--cb-stepper-n' as string]: String(steps.length),
          ['--cb-stepper-p' as string]: String(progress),
        }}
      >
        {steps.map((step, index) => {
          const active = index === activeIndex
          return (
            <li key={step.id} data-done={step.done} data-active={active}>
              <a
                href={`#${step.id}`}
                aria-current={active ? 'step' : undefined}
                onClick={(event) => {
                  const target = document.getElementById(step.id)
                  if (!target) return
                  event.preventDefault()
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  history.replaceState(null, '', `#${step.id}`)
                }}
              >
                <span className="cb-stepper-mark" aria-hidden>
                  {step.done ? (
                    <svg viewBox="0 0 16 16" width="12" height="12">
                      <path
                        d="M3.5 8.2 6.4 11 12.5 4.8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="cb-stepper-label">{step.label}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
