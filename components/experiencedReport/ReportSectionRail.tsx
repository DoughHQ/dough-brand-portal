'use client'

import { useEffect, useState } from 'react'
import { REPORT_SECTIONS } from './reportSections'

export function ReportSectionRail() {
  const [active, setActive] = useState<string>(REPORT_SECTIONS[0].id)

  useEffect(() => {
    const ratios = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        let bestId = REPORT_SECTIONS[0].id
        let best = -1
        for (const section of REPORT_SECTIONS) {
          const ratio = ratios.get(section.id) ?? 0
          if (ratio > best) {
            best = ratio
            bestId = section.id
          }
        }
        if (best > 0) setActive(bestId)
      },
      { root: null, rootMargin: '-18% 0px -58% 0px', threshold: [0, 0.1, 0.25, 0.5, 1] }
    )

    for (const section of REPORT_SECTIONS) {
      const el = document.getElementById(section.id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  return (
    <nav className="report-section-rail no-print" aria-label="Report sections">
      {REPORT_SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={active === section.id ? 'is-current' : undefined}
          aria-current={active === section.id ? 'location' : undefined}
        >
          <span className="report-section-rail-n">{section.n}</span>
          {section.label}
        </a>
      ))}
    </nav>
  )
}
