'use client'

import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'

/**
 * Brand catalog canvas under `.portal-main`.
 *
 * Always use this instead of `<div className="cat-page">`.
 * WebKit has repeatedly collapsed this canvas to min-content after paint
 * (font swap / client reflow). CSS uses viewport-definite main width;
 * this guard re-stretches if computed width falls absurdly below main.
 */
export default function CatPage({
  children,
  className,
  ...rest
}: {
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const rootClass = ['cat-page', className].filter(Boolean).join(' ')

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const main = root.closest('.portal-main')
    if (!(main instanceof HTMLElement)) return

    const heal = () => {
      const mainW = main.getBoundingClientRect().width
      const rootW = root.getBoundingClientRect().width
      // Desktop main is hundreds of px; one-word collapse is ~40–120px.
      if (mainW >= 480 && rootW > 0 && rootW < Math.min(240, mainW * 0.35)) {
        root.style.width = '100%'
        root.style.maxWidth = 'none'
        root.style.minWidth = '100%'
        const cq = root.querySelector('.cat-page-cq')
        if (cq instanceof HTMLElement) {
          cq.style.width = '100%'
          cq.style.maxWidth = 'none'
          cq.style.minWidth = '100%'
        }
      }
    }

    heal()
    const ro = new ResizeObserver(heal)
    ro.observe(main)
    ro.observe(root)
    void document.fonts?.ready.then(heal)
    window.addEventListener('resize', heal)
    // Font swap / late CSS often lands just after first paint.
    const t1 = window.setTimeout(heal, 100)
    const t2 = window.setTimeout(heal, 600)
    const t3 = window.setTimeout(heal, 1500)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', heal)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [])

  return (
    <div ref={rootRef} className={rootClass} {...rest}>
      <div className="cat-page-cq">{children}</div>
    </div>
  )
}
