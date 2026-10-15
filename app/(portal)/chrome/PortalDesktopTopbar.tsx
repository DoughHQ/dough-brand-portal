import { NavGlyph } from './NavGlyph'

import type { PortalChrome } from './usePortalLayout'

export function PortalDesktopTopbar(chrome: PortalChrome) {
  const {
    sectionLabel, openPalette, modKey, accountRef, accountOpen, setAccountOpen,
    accountName, dark, setDark, isPlatform, sidebarBrandName, handleSignOut,
  } = chrome
  return (
        <header className="portal-desktop-topbar">
      <div className="portal-desktop-topbar-left">
        <h1 className="portal-desktop-title">{sectionLabel}</h1>
      </div>
      <button
        type="button"
        className="portal-search-trigger"
        onClick={openPalette}
      >
        <NavGlyph name="search" />
        <span className="portal-search-trigger-placeholder">
          Search pages, studies, products…
        </span>
        <kbd className="portal-search-kbd">{modKey}K</kbd>
      </button>
      <div className="portal-desktop-topbar-right" ref={accountRef}>
        <button
          type="button"
          className={`portal-account-btn${accountOpen ? ' is-open' : ''}`}
          aria-expanded={accountOpen}
          aria-haspopup="menu"
          onClick={() => setAccountOpen((o) => !o)}
        >
          <span className="portal-account-avatar">{accountName[0]?.toUpperCase() ?? 'D'}</span>
          <span className="portal-account-name">{accountName}</span>
          <NavGlyph name="chevron" />
        </button>
        {accountOpen ? (
          <div className="portal-account-menu" role="menu">
            <div className="portal-account-menu-meta">
              <strong>{accountName}</strong>
              <span>{isPlatform ? 'Platform admin' : sidebarBrandName}</span>
            </div>
            <button
              type="button"
              className="portal-account-menu-item"
              role="menuitem"
              onClick={() => {
                setDark(!dark)
                setAccountOpen(false)
              }}
            >
              <NavGlyph name={dark ? 'sun' : 'moon'} />
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              type="button"
              className="portal-account-menu-item"
              role="menuitem"
              onClick={() => {
                setAccountOpen(false)
                void handleSignOut()
              }}
            >
              <NavGlyph name="logout" />
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
