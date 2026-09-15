import { describe, expect, it } from 'vitest'
import { parseBrandProductPage } from '../parseBrandProductPage'

describe('parseBrandProductPage', () => {
  it('maps keyset page + cursor', () => {
    const page = parseBrandProductPage({
      brand_id: 7,
      items: [
        {
          product_id: 1,
          name: 'Bar',
          image_url: null,
          category: 'Bars',
          l2_name: 'Snack bars',
          l3_name: 'Bars',
          total_battles: 12,
          l2_node_id: 9,
          has_battle_data: true,
          is_claimed: true,
        },
      ],
      has_more: true,
      next_cursor: { total_battles: 12, product_id: 1 },
    })
    expect(page?.items).toHaveLength(1)
    expect(page?.hasMore).toBe(true)
    expect(page?.nextCursor?.productId).toBe(1)
    expect(page?.items[0].name).toBe('Bar')
    expect(page?.items[0].isClaimed).toBe(true)
  })

  it('defaults isClaimed to false when absent', () => {
    const page = parseBrandProductPage({
      brand_id: 7,
      items: [{ product_id: 2, name: 'X', total_battles: 0 }],
      has_more: false,
    })
    expect(page?.items[0].isClaimed).toBe(false)
  })

  it('clears cursor when has_more is false', () => {
    const page = parseBrandProductPage({
      brand_id: 7,
      items: [],
      has_more: false,
      next_cursor: { total_battles: 1, product_id: 2 },
    })
    expect(page?.hasMore).toBe(false)
    expect(page?.nextCursor).toBeNull()
  })
})
