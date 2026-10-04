import { redirect } from 'next/navigation'
import { getBrand } from '@/lib/queries'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { listBrandPrototypesAction } from './actions'
import PrototypesClient from './PrototypesClient'

export default async function PrototypesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope

  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    return (
      <div className="cat-page">
        <div className="cat-page-cq" style={{ padding: 32 }}>
          <h1 className="cat-title">Prototypes</h1>
          <p style={{ color: 'var(--ink-50)', maxWidth: 420, lineHeight: 1.5 }}>
            Impersonate a brand to manage its private prototype library.
          </p>
        </div>
      </div>
    )
  }

  if (effectiveBrandId == null) redirect('/login')

  const [brand, listed] = await Promise.all([
    getBrand(effectiveBrandId),
    listBrandPrototypesAction(),
  ])
  if (!brand) redirect('/login')

  return (
    <PrototypesClient
      brandId={effectiveBrandId}
      brandName={brand.brand_name_display ?? brand.brand_name}
      initialItems={listed.ok ? listed.data : []}
      loadError={listed.ok ? null : listed.error}
    />
  )
}
