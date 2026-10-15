import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import { pulseItem } from './homeModel'

export function buildHomeStrip({
  model,
  totalProductCount,
  totalBattles,
}: {
  model: BrandHomeModel
  totalProductCount: number
  totalBattles: number
}) {
  const categoriesPulse = pulseItem(model, 'categories')
  const battledPulse = pulseItem(model, 'battled')
  const studiesPulse = pulseItem(model, 'studies')

  const strip: {
    key: string
    label: string
    value: string
    sub?: string
    icon: string
    href: string
  }[] = [
    {
      key: 'products',
      label: 'Products',
      value: totalProductCount.toLocaleString(),
      sub:
        battledPulse != null
          ? `${battledPulse.value} with battles`
          : `${model.productsWithBattles.toLocaleString()} with battles`,
      icon: 'M4 7h16M4 12h16M4 17h10',
      href: '/products',
    },
    {
      key: 'categories',
      label: 'Categories',
      value: categoriesPulse?.value ?? String(model.categories.length),
      sub: categoriesPulse?.detail ?? 'With your products',
      icon: 'M4 20V10l8-6 8 6v10H4z',
      href: '/categories',
    },
    {
      key: 'comparisons',
      label: 'Comparisons',
      value: totalBattles.toLocaleString(),
      icon: 'M7 10h10M7 14h6M5 5h14v14H5z',
      href: '/products',
    },
    {
      key: 'studies',
      label: 'Studies',
      value: studiesPulse?.value ?? String(model.openStudiesCount),
      sub: studiesPulse?.detail ?? 'Live or scheduled',
      icon: 'M8 6h8v14H8zM10 9h4',
      href: '/studies',
    },
  ]
  return strip
}
