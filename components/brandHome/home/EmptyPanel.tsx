import Link from 'next/link'

export function EmptyPanel({
  title,
  body,
  href,
  cta,
  ctaPrimary = false,
}: {
  title: string
  body: string
  href: string
  cta: string
  ctaPrimary?: boolean
}) {
  return (
    <div className="bh-empty portal-panel">
      <p className="bh-empty-title">{title}</p>
      <p className="bh-empty-body">{body}</p>
      <Link
        href={href}
        className={ctaPrimary ? 'portal-btn portal-btn-cta' : 'bh-link'}
      >
        {cta}
      </Link>
    </div>
  )
}
