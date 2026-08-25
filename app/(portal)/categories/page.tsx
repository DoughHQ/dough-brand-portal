import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrand } from '@/lib/queries'
import CategoryLauncher from '@/components/categories/CategoryLauncher'

export default async function BrandCategoriesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope
  // Platform admins use readiness / report-preview — brand Categories is for brand shell.
  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    redirect('/admin/categories')
  }

  const brand = await getBrand(effectiveBrandId)
  if (!brand) redirect('/login')

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 960, margin: '0 auto', padding: '36px 32px 80px' }}>
      <CategoryLauncher brandName={brand.brand_name} />
    </div>
  )
}
