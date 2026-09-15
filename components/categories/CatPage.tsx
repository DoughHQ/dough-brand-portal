import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Brand catalog canvas under `.portal-main`.
 *
 * Always use this instead of `<div className="cat-page">`.
 * Never put `container` / `container-type` on `.cat-page` — a stale Next
 * CSS chunk with `container: cat-page/inline-size` collapsed WebKit to
 * one-word width for days while source looked fixed.
 */
export default function CatPage({
  children,
  className,
  ...rest
}: {
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>) {
  const rootClass = ['cat-page', className].filter(Boolean).join(' ')
  return (
    <div className={rootClass} {...rest}>
      <div className="cat-page-cq">{children}</div>
    </div>
  )
}
