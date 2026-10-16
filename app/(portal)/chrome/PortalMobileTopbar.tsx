import { NavGlyph } from './NavGlyph'

import type { PortalChrome } from './usePortalLayout'

export function PortalMobileTopbar(chrome: PortalChrome) {
  const {
    navOpen, setNavOpen, sectionLabel, openPalette, showImpersonationStrip,
    impersonatedBrandName, exitImpersonation, exiting,
  } = chrome
  return (
    <header className="portal-topbar portal-topbar-mobile">
  <div className="portal-topbar-row">
    <button
      type="button"
      className="portal-menu-btn"
      aria-expanded={navOpen}
      aria-controls="portal-nav-drawer"
      aria-label={navOpen ? 'Close menu' : 'Open menu'}
      onClick={() => setNavOpen((o) => !o)}
    >
      <span className="portal-menu-stroke" aria-hidden />
      <span className="portal-menu-stroke" aria-hidden />
      <span className="portal-menu-stroke" aria-hidden />
    </button>
    <div className="portal-topbar-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- local brand mark */}
      <img
        className="portal-topbar-mark"
        src="/brand/runoff-mark-32px-reversed.svg"
        alt=""
        width={32}
        height={32}
      />
      <span className="portal-topbar-section">{sectionLabel}</span>
    </div>
    <button
      type="button"
      className="portal-topbar-search-icon"
      aria-label="Search"
      onClick={openPalette}
    >
      <NavGlyph name="search" />
    </button>
  </div>
  {showImpersonationStrip ? (
    <div className="portal-topbar-impersonation">
      <span className="portal-topbar-impersonation-label">
        Viewing as <strong>{impersonatedBrandName}</strong>
      </span>
      <button
        type="button"
        className="portal-topbar-impersonation-exit"
        onClick={() => void exitImpersonation()}
        disabled={exiting}
      >
        {exiting ? '…' : 'Exit'}
      </button>
    </div>
  ) : null}
</header>
  )
}
