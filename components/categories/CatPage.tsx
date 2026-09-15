import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Brand catalog canvas under `.portal-main`.
 *
 * Always use this instead of `<div className="cat-page">`.
 * Do not put `container-type` on `.cat-page` or `.cat-page-cq` — WebKit
 * flex + size containment collapses the page to one-word width.
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
