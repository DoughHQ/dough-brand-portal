import type { BuilderStep } from './builderStep'
import BuilderStepMark from './BuilderStepMark'

export default function BuilderStepLink({
  step,
  index,
  active,
}: {
  step: BuilderStep
  index: number
  active: boolean
}) {
  return (
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
      <BuilderStepMark done={step.done} index={index} />
      <span className="cb-stepper-label">{step.label}</span>
    </a>
  )
}
