import Link from 'next/link'
import { PRODUCT_NAME } from '@/lib/brand'
import { NavGlyph } from './NavGlyph'
import { isNavActive } from './portalNav'

import type { PortalChrome } from './usePortalLayout'

export function PortalAside(chrome: PortalChrome) {
  const {
    asideRef, drawerInert, isPlatform, workspaceHref, sidebarBrandInitial,
    sidebarBrandName, isImpersonating, catalogProductCount, navSections,
    pathname, queueBadges, modKey,
  } = chrome
  return (
      <aside
    ref={asideRef}
    id="portal-nav-drawer"
    className="portal-aside"
    aria-label="Portal navigation"
    aria-hidden={drawerInert ? true : undefined}
  >
    <div className="portal-mark">
      <div className="portal-mark-lockup">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="portal-mark-logo"
            src="/brand/runoff-horizontal-reversed.svg"
            alt={PRODUCT_NAME}
            width={140}
            height={32}
          />
          <div className="portal-mark-sub">
            {isPlatform ? 'Platform' : 'Brand Intelligence'}
          </div>
        </div>
      </div>
    </div>

    {workspaceHref ? (
      <Link href={workspaceHref} className="portal-workspace portal-workspace-link">
        <div className="portal-workspace-mark">{sidebarBrandInitial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="portal-workspace-name">{sidebarBrandName}</div>
          <div className="portal-workspace-meta">
            {isPlatform
              ? 'Ops · Switch brand'
              : isImpersonating
                ? 'Impersonating · tap to switch'
                : `Brand workspace · ${catalogProductCount} product${catalogProductCount !== 1 ? 's' : ''}`}
          </div>
        </div>
        <span className="portal-workspace-chevron" aria-hidden>
          <NavGlyph name="chevron" />
        </span>
      </Link>
    ) : (
      <div className="portal-workspace">
        <div className="portal-workspace-mark">{sidebarBrandInitial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="portal-workspace-name">{sidebarBrandName}</div>
          <div className="portal-workspace-meta">
            {`Brand workspace · ${catalogProductCount} product${catalogProductCount !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>
    )}

    <nav className="portal-nav">
      {navSections.map((section) => (
        <div key={section.group}>
          <div className="portal-nav-group-label">{section.group}</div>
          <div className="portal-nav-items">
            {section.items.map((item) => {
              const active = isNavActive(pathname, item.href)
              const badge =
                item.badge && isPlatform
                  ? queueBadges[item.badge]
                  : !isPlatform && item.label === 'Products'
                    ? catalogProductCount
                    : 0
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch={item.prefetch}
                  className={`portal-nav-link${active ? ' is-active' : ''}`}
                >
                  <NavGlyph name={item.icon} />
                  <span className="portal-nav-label">{item.label}</span>
                  {badge > 0 ? (
                    <span className={`portal-nav-count${item.badge ? ' is-queue' : ''}`}>
                      {badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>

    <div className="portal-foot portal-foot-compact">
      <p className="portal-foot-hint">
        Press <kbd>{modKey}K</kbd> to search
      </p>
    </div>
  </aside>
  )
}
