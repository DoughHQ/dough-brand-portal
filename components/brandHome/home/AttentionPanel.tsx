import Link from 'next/link'
import type { buildHomeAttention } from '@/lib/brandHome/homeAttention'

export function AttentionPanel({
  attention,
}: {
  attention: ReturnType<typeof buildHomeAttention>
}) {
  return (
    <section className="bh-ops portal-panel" aria-label="Needs attention">
      <div className="bh-ops-copy">
        <p className="bh-ops-eyebrow">Needs attention</p>
        <ul className="bh-ops-list">
          {attention.map((item) => (
            <li key={item.id} className="bh-ops-row">
              <div>
                <p className="bh-ops-title">{item.title}</p>
                <p className="bh-ops-body">{item.body}</p>
              </div>
              <Link href={item.href} className="portal-btn portal-btn-secondary">
                {item.ctaLabel}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="bh-ops-actions">
        <Link href="/studies/new" className="portal-btn portal-btn-cta">
          New study
        </Link>
      </div>
    </section>
  )
}
