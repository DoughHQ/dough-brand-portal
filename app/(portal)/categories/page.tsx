import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrand } from '@/lib/queries'
import { fetchBrandAdjacentCategories } from '@/lib/adjacentCategories.server'
import CategoryLauncher from '@/components/categories/CategoryLauncher'
import '@/components/categories/categoriesPage.css'

export default async function BrandCategoriesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope
  // Platform admins use readiness / report-preview — brand Categories is for brand shell.
  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    redirect('/admin/categories')
  }

  const [brand, adjacentCategories] = await Promise.all([
    getBrand(effectiveBrandId),
    fetchBrandAdjacentCategories({ brandId: effectiveBrandId }),
  ])
  if (!brand) redirect('/login')

  return (
    <div className="cat-page">
      <CategoryLauncher brandName={brand.brand_name} adjacentCategories={adjacentCategories} />
    </div>
  )
}
