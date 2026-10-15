'use client'

import { CommandPalette } from '@/components/portal/CommandPalette'
import type { AdminQueueBadges } from '@/lib/adminHome/types'
import type { PortalUser } from '@/lib/queries'
import { PortalAside } from './chrome/PortalAside'
import { PortalDesktopTopbar } from './chrome/PortalDesktopTopbar'
import { PortalImpersonationBar } from './chrome/PortalImpersonationBar'
import { PortalMobileTopbar } from './chrome/PortalMobileTopbar'
import { usePortalLayout } from './chrome/usePortalLayout'
import './portalLayout.css'

interface PortalLayoutClientProps {
  /** From get_brand_portal_chrome — never a full brand/subscription hydrate. */
  brandName: string | null
  portalUser: PortalUser
  /** Active catalog products for workspace chrome label / Products badge. */
  catalogProductCount?: number
  queueBadges?: AdminQueueBadges
  isAdmin: boolean
  isImpersonating: boolean
  impersonatedBrandName: string | null
  /** Session brand for ⌘K draft resume (null on pure admin chrome). */
  effectiveBrandId?: number | null
  children: React.ReactNode
}

export default function PortalLayoutClient({
  children,
  brandName,
  portalUser,
  catalogProductCount = 0,
  queueBadges = { safety: 0, corrections: 0, ownership: 0, applications: 0, boxes: 0 },
  isAdmin,
  isImpersonating,
  impersonatedBrandName,
  effectiveBrandId = null,
}: PortalLayoutClientProps) {
  const chrome = usePortalLayout({
    brandName,
    portalUser,
    catalogProductCount,
    queueBadges,
    isAdmin,
    isImpersonating,
    impersonatedBrandName,
    effectiveBrandId,
  })
  const {
    dark,
    navOpen,
    closeNav,
    paletteOpen,
    setPaletteOpen,
    commandItems,
    searchRemote,
    bootstrapRemote,
    isPlatform,
    effectiveBrandId: sessionBrandId,
    showImpersonationStrip,
  } = chrome

  return (
    <div className={`portal-shell${dark ? ' dark' : ''}${navOpen ? ' is-nav-open' : ''}`}>
      <PortalMobileTopbar {...chrome} />

      <button
        type="button"
        className="portal-nav-scrim"
        aria-label="Close menu"
        tabIndex={navOpen ? 0 : -1}
        onClick={closeNav}
      />

      <div className="portal-body">
        <PortalAside {...chrome} />

        <main className="portal-main">
          <PortalDesktopTopbar {...chrome} />

          {showImpersonationStrip ? <PortalImpersonationBar {...chrome} /> : null}

          <div className="portal-main-body">{children}</div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={commandItems}
        searchRemote={isPlatform ? undefined : searchRemote}
        bootstrapRemote={isPlatform ? undefined : bootstrapRemote}
        effectiveBrandId={sessionBrandId}
      />
    </div>
  )
}
