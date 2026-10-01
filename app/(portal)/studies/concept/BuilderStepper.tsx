'use client'

export type BuilderStep = {
  id: string
  label: string
  done: boolean
}

/**
 * Numbered section bar. Each step is a real link to that section's id.
 * The fill stops at the first section that still needs input.
 */
export default function BuilderStepper({
  steps,
  label,
}: {
  steps: BuilderStep[]
  label: string
}) {
  const activeIndex = steps.findIndex((step) => !step.done)
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
