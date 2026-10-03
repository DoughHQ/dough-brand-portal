import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import './marketingWorkspace.css'

export const metadata: Metadata = {
  title: 'Dough workspace preview',
  robots: 'noindex, nofollow',
}

export default function MarketingWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mw-shell">
      <aside className="mw-nav" aria-hidden="true">
        <div className="mw-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dough-mark.png" alt="" width={28} height={28} />
          <span>Dough</span>
        </div>
        <nav>
          <span className="mw-nav-item is-on">Home</span>
          <span className="mw-nav-item">Products</span>
          <span className="mw-nav-item">Studies</span>
          <span className="mw-nav-item">Reports</span>
        </nav>
        <p className="mw-sim">Simulated preview</p>
      </aside>
      <div className="mw-main">{children}</div>
    </div>
  )
}
