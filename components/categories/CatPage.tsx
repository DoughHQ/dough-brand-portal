import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Brand catalog canvas under `.portal-main`.
 *
 * Size containment MUST live on the inner `.cat-page-cq`, never on `.cat-page`.
 * Putting `container-type` on the flex child of `.portal-main` collapses the
 * page to min-content (~one word wide) in Safari/WebKit — and then
 * `@container cat-page (max-width: 559px)` falsely fires on desktop.
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
