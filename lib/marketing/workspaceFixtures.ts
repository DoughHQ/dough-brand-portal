import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'

/** Simulated brand home for public marketing embeds. No live brand data. */
export const marketingHomeModel: BrandHomeModel = {
  brandName: 'Keel Still',
  hero: {
    kind: 'study_ready',
    eyebrow: 'Concept report ready',
    headline: 'New label vs current pack',
    body: '120 New York shoppers finished. The verdict is waiting in the report.',
    ctaLabel: 'Open report',
    ctaHref: '/marketing/workspace/report',
  },
  pulse: [
    { key: 'products', label: 'Products', value: '42', detail: 'Claimed in catalog' },
    { key: 'categories', label: 'Categories', value: '6', detail: 'With your products' },
    { key: 'battled', label: 'With battles', value: '28', detail: 'Enough signal to show' },
    { key: 'studies', label: 'Studies', value: '3', detail: '1 report ready' },
  ],
  categories: [
    {
      l2NodeId: 101,
      name: 'Still water',
      status: 'active',
      detail: 'Standing available where shoppers have chosen',
      href: '#',
      unlocked: true,
      ctaLabel: 'Open category',
      bannerImageUrl: null,
    },
    {
      l2NodeId: 102,
      name: 'Sparkling water',
      status: 'building',
      detail: 'More battles needed before a standing',
      href: '#',
      unlocked: false,
      ctaLabel: 'Building',
      bannerImageUrl: null,
    },
  ],
  products: [
    {
      productId: 1,
      name: 'Keel Still 1L',
      category: 'Still water',
      chip: 'gaining',
      insight: 'Preference strength up over the last 30 days.',
      rankLabel: null,
      href: '#',
    },
    {
      productId: 2,
      name: 'Keel Still 500ml',
      category: 'Still water',
      chip: 'stable',
      insight: '184 battles counted · holding steady.',
      rankLabel: null,
      href: '#',
    },
  ],
  studies: [
    {
      missionId: 'marketing-concept-1',
      title: 'New label vs current pack',
      badge: 'Results ready',
      detail: '120 completed · concept',
      progress: 1,
      href: '/marketing/workspace/report',
      ctaLabel: 'View results',
    },
    {
      missionId: 'marketing-box-1',
      title: 'In-home box — spring pack',
      badge: 'Fielding',
      detail: '38 of 80 seats',
      progress: 0.48,
      href: '#',
      ctaLabel: 'Open study',
    },
  ],
  openStudiesCount: 2,
  productsWithBattles: 28,
}
