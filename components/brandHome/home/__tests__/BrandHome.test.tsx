import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'

vi.mock('@/components/brandHome/brandHome.css', () => ({}))
vi.mock('@/components/brandHome/WhatChangedStrip', () => ({
  default: ({ brandId }: { brandId: number }) => <i>What changed {brandId}</i>,
}))
vi.mock('@/components/brandHome/ProductSignalCard', () => ({
  default: ({ card, variant }: { card: { name: string }; variant: string }) => (
    <i>
      {variant}:{card.name}
    </i>
  ),
}))
vi.mock('@/components/brandHome/CatalogHealthCard', () => ({
  default: () => <i>Catalog health</i>,
}))
vi.mock('@/components/brandHome/OnboardingChecklist', () => ({
  default: () => <i>Onboarding</i>,
}))

import BrandHome from '../../BrandHome'

const model: BrandHomeModel = {
  brandName: 'Acme',
  hero: {
    kind: 'narrative',
    eyebrow: 'Hero eyebrow',
    headline: 'Hero headline',
    body: 'Hero body',
    ctaLabel: 'Hero CTA',
    ctaHref: '/go',
  },
  pulse: [{ key: 'categories', label: 'Categories', value: '2', detail: 'With you' }],
  categories: [
    {
      l2NodeId: 1,
      name: 'Snacks',
      status: 'active',
      detail: '3 products',
      href: '/c/1',
      unlocked: true,
      ctaLabel: 'Open Overview',
      bannerImageUrl: null,
    },
    {
      l2NodeId: 2,
      name: 'Drinks',
      status: 'building',
      detail: '',
      href: '/c/2',
      unlocked: false,
      ctaLabel: 'Unlock',
      bannerImageUrl: null,
    },
  ],
  products: [],
  studies: [
    {
      missionId: 'm1',
      title: 'Taste test',
      badge: 'Results ready',
      detail: 'Done',
      progress: 100,
      href: '/s/m1',
      ctaLabel: 'View results',
    },
  ],
  openStudiesCount: 1,
  productsWithBattles: 4,
}

const card = (id: number) =>
  ({
    productId: id,
    name: `Product ${id}`,
    category: null,
    imageUrl: null,
    comparisonEvents: 1,
    href: `/p/${id}`,
    standing: {},
  }) as unknown as ProductSignalCardModel

function inOrder(html: string, parts: string[]) {
  let cursor = 0
  for (const part of parts) {
    const at = html.indexOf(part, cursor)
    expect(at, part).toBeGreaterThanOrEqual(0)
    cursor = at + part.length
  }
}

describe('BrandHome', () => {
  it('renders the full workspace in order', () => {
    const html = renderToStaticMarkup(
      <BrandHome
        model={model}
        profileSlot={<b>Profile slot</b>}
        totalProductCount={1200}
        totalBattles={5}
        signalCards={[card(1), card(2)]}
        brandId={7}
      />,
    ).replaceAll('<!-- -->', '')
    inOrder(html, [
      'Profile slot',
      'New study',
      'Needs attention',
      'What changed 7',
      'Portfolio snapshot',
      '1,200',
      'Open studies',
      'Taste test',
      'Your products',
      'lead:Product 1',
      'row:Product 2',
      'Your categories',
      'Snacks',
      'Active',
      'Drinks',
      'Locked',
      'Subscribe to open the full category Overview.',
      'Hero headline',
      'With you',
    ])
  })

  it('renders empty states without optional regions', () => {
    const html = renderToStaticMarkup(
      <BrandHome model={{ ...model, categories: [], studies: [], pulse: [] }} />,
    )
    expect(html).toContain('No active research')
    expect(html).toContain('Bring your products into')
    expect(html).toContain('No categories yet')
    expect(html).not.toContain('What changed')
    expect(html).not.toContain('Catalog health')
    expect(html).not.toContain('Onboarding')
  })

  it('shows the no-signal state when products exist without signal', () => {
    const html = renderToStaticMarkup(<BrandHome model={model} totalProductCount={3} />)
    expect(html).toContain('No product signal yet')
  })
})
