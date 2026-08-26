import { describe, expect, it } from 'vitest'
import {
  competeCategoriesFromLauncher,
  entitledL2IdsFromLauncher,
  launcherRowsToBrandCategoryL2,
  parseBrandCategoryLauncher,
  sumCompeteBattles,
} from '../categoryLauncher'

describe('launcher → home category helpers', () => {
  const launcher = parseBrandCategoryLauncher({
    owned: [
      {
        l2_id: 1,
        l2_name: 'Owned Cat',
        total_products: 2,
        products_with_battles: 1,
        total_battles: 10,
        entitled: true,
      },
    ],
    has_products: [
      {
        l2_id: 1,
        l2_name: 'Owned Cat dup',
        total_products: 9,
        products_with_battles: 0,
        total_battles: 0,
        entitled: false,
      },
      {
        l2_id: 2,
        l2_name: 'Compete',
        total_products: 30,
        products_with_battles: 1,
        total_battles: 79,
        entitled: false,
        banner_image_url: 'https://cdn.example/compete.jpg',
      },
    ],
    browse: [{ l2_id: 3, l2_name: 'Browse only', entitled: false, total_battles: 999 }],
    search: null,
  })

  it('uses owned ∪ has_products and lets owned win on conflict', () => {
    const rows = competeCategoriesFromLauncher(launcher)
    expect(rows.map((r) => r.l2_id).sort()).toEqual([1, 2])
    expect(rows.find((r) => r.l2_id === 1)?.total_battles).toBe(10)
    expect(sumCompeteBattles(rows)).toBe(89)
  })

  it('maps to BrandCategoryL2 and collects entitled ids', () => {
    const rows = competeCategoriesFromLauncher(launcher)
    const cats = launcherRowsToBrandCategoryL2(rows)
    expect(cats).toHaveLength(2)
    expect(cats.find((c) => c.l2NodeId === 2)?.battles).toBe(79)
    expect(cats.find((c) => c.l2NodeId === 2)?.bannerImageUrl).toBe('https://cdn.example/compete.jpg')
    expect(cats.find((c) => c.l2NodeId === 1)?.bannerImageUrl).toBeNull()
    expect(entitledL2IdsFromLauncher(launcher)).toEqual([1])
  })
})
