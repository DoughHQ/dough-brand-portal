import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { perfLog, perfNow, timed } from '@/lib/perf'
import PortalLayoutClient from './PortalLayoutClient'
import LegacyBrandIdGate from './components/LegacyBrandIdGate'
import { getAdminQueueBadges } from '@/lib/adminHome/fetchAdminHomeSnapshot.server'
import { getBrandPortalChrome } from '@/lib/brandHome/fetchBrandPortalChrome.server'
import type { AdminQueueBadges } from '@/lib/adminHome/types'
import Link from 'next/link'

function ChromeUnavailable({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          background: 'var(--amber-pale, #fef6e8)',
          borderBottom: '1px solid rgba(192,120,24,0.25)',
          padding: '10px 24px',
          fontSize: 13,
          color: 'var(--amber, #c07818)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Brand chrome failed to load (not a login error).{' '}
        <Link href="/dashboard" style={{ fontWeight: 600, color: 'inherit' }}>
          Retry
        </Link>
      </div>
      {children}
    </div>
  )
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const t0 = perfNow()
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, isImpersonating } = scope
  const isAdmin = portalUser.role === 'dough_admin'

  let brandName: string | null = null
  let catalogProductCount = 0
  let chromeFailed = false
  let queueBadges: AdminQueueBadges = {
    corrections: 0,
    ownership: 0,
    applications: 0,
    boxes: 0,
  }

  if (!isAdmin || isImpersonating) {
    const chrome = await timed('brand.chrome', () => getBrandPortalChrome())
    if (!chrome) {
      // Soft shell — do not bounce to login for RPC/chrome failures.
      chromeFailed = true
      brandName = isImpersonating ? 'Brand' : null
    } else {
      brandName = chrome.brandName
      catalogProductCount = chrome.catalogProductCount
    }
  } else {
    try {
      queueBadges = await getAdminQueueBadges()
    } catch {
      queueBadges = { corrections: 0, ownership: 0, applications: 0, boxes: 0 }
    }
  }

  perfLog('layout.total', perfNow() - t0, {
    impersonating: isImpersonating,
    admin: isAdmin,
    chromeFailed,
  })

  const body = (
    <PortalLayoutClient
      brandName={brandName}
      portalUser={portalUser}
      catalogProductCount={catalogProductCount}
      queueBadges={queueBadges}
      isAdmin={isAdmin}
      isImpersonating={isImpersonating}
      impersonatedBrandName={isImpersonating ? brandName : null}
    >
      <LegacyBrandIdGate isAdmin={isAdmin} isImpersonating={isImpersonating}>
        {children}
      </LegacyBrandIdGate>
    </PortalLayoutClient>
  )

  return (
    <Suspense fallback={null}>
      {chromeFailed ? <ChromeUnavailable>{body}</ChromeUnavailable> : body}
    </Suspense>
  )
}
