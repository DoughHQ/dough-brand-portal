'use client'

import { useEffect, useState } from 'react'
import type { BuilderStep } from './builderStep'

export function useBuilderStepper(steps: BuilderStep[]) {
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

  return { activeIndex, progress }
}
