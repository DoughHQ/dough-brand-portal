'use client'

import type { BuilderStep } from './stepper/builderStep'
import BuilderStepLink from './stepper/BuilderStepLink'
import { useBuilderStepper } from './stepper/useBuilderStepper'

export type { BuilderStep } from './stepper/builderStep'

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
  const stepper = useBuilderStepper(steps)

  return (
    <nav className="cb-stepper" aria-label={label}>
      <ol
        className="cb-stepper-list"
        style={{
          ['--cb-stepper-n' as string]: String(steps.length),
          ['--cb-stepper-p' as string]: String(stepper.progress),
        }}
      >
        {steps.map((step, index) => {
          const active = index === stepper.activeIndex
          return (
            <li key={step.id} data-done={step.done} data-active={active}>
              <BuilderStepLink step={step} index={index} active={active} />
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
