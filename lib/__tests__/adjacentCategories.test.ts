import { describe, expect, it } from 'vitest'
import {
  parseBrandAdjacentCategories,
  rpcErrorFields,
  toAdjacentCategoriesResult,
} from '../adjacentCategories'

describe('parseBrandAdjacentCategories', () => {
  it('returns empty for null or missing adjacent', () => {
    expect(parseBrandAdjacentCategories(null)).toEqual([])
    expect(parseBrandAdjacentCategories({})).toEqual([])
    expect(parseBrandAdjacentCategories({ adjacent: null })).toEqual([])
  })

  it('unwraps a one-element PostgREST envelope', () => {
    const parsed = parseBrandAdjacentCategories([
      {
        brand_id: 9,
        adjacent: [{ l2_id: 10, l2_name: 'Juices', l1_name: 'Beverages' }],
      },
    ])
    expect(parsed.map((c) => c.l2_id)).toEqual([10])
  })

  it('preserves RPC order and skips invalid rows', () => {
    const parsed = parseBrandAdjacentCategories({
      brand_id: 9,
      adjacent: [
        { l2_id: 3, l2_name: 'C', l1_name: 'Drinks', banner_image_url: 'https://x/c.jpg' },
        { l2_id: 0, l2_name: 'Bad' },
        { l2_id: 1, l2_name: 'A', l1_name: '', icon_name: 'water-outline' },
        { l2_name: 'No id' },
      ],
    })
    expect(parsed.map((c) => c.l2_id)).toEqual([3, 1])
    expect(parsed[0]).toEqual({
      l2_id: 3,
      l2_name: 'C',
      l1_name: 'Drinks',
      banner_image_url: 'https://x/c.jpg',
      icon_name: null,
    })
    expect(parsed[1]?.icon_name).toBe('water-outline')
    expect(parsed[1]?.l1_name).toBeNull()
  })

  it('never attaches count or entitled fields', () => {
    const [row] = parseBrandAdjacentCategories({
      adjacent: [
        {
          l2_id: 7,
          l2_name: 'Milk',
          total_products: 12,
          total_battles: 40,
          entitled: true,
        },
      ],
    })
    expect(row).toEqual({
      l2_id: 7,
      l2_name: 'Milk',
      l1_name: null,
      banner_image_url: null,
      icon_name: null,
    })
    expect(row).not.toHaveProperty('total_products')
    expect(row).not.toHaveProperty('total_battles')
    expect(row).not.toHaveProperty('entitled')
  })
})

describe('toAdjacentCategoriesResult', () => {
  it('maps a supabase error to ok: false with all four fields', () => {
    const result = toAdjacentCategoriesResult(null, {
      code: 'PGRST202',
      message: 'Could not find the function',
      details: 'Searched without parameters',
      hint: 'Perhaps you meant get_brand_category_launcher',
    })
    expect(result).toEqual({
      ok: false,
      rows: [],
      error: {
        code: 'PGRST202',
        message: 'Could not find the function',
        details: 'Searched without parameters',
        hint: 'Perhaps you meant get_brand_category_launcher',
      },
    })
  })

  it('reads message from Error.prototype when it is a PostgrestError-shaped instance', () => {
    const err = Object.assign(new Error('Row level security prevented the request'), {
      code: 'PGRST301',
      details: 'RLS denied',
      hint: 'Check policies',
    })
    expect(rpcErrorFields(err)).toEqual({
      code: 'PGRST301',
      message: 'Row level security prevented the request',
      details: 'RLS denied',
      hint: 'Check policies',
    })
    expect(toAdjacentCategoriesResult({ adjacent: [] }, err).ok).toBe(false)
  })

  it('treats a real empty adjacent array as ok: true with no drift flag', () => {
    expect(toAdjacentCategoriesResult({ brand_id: 9, adjacent: [] }, null)).toEqual({
      ok: true,
      rows: [],
    })
    expect(toAdjacentCategoriesResult({ adjacent: [] }, null)).not.toHaveProperty(
      'allRowsUnparsed'
    )
  })

  it('treats a missing or non-array adjacent key as ok: false invalid_envelope', () => {
    expect(toAdjacentCategoriesResult(null, null)).toEqual({
      ok: false,
      rows: [],
      error: {
        code: 'invalid_envelope',
        message: 'unparseable adjacent envelope',
        details: null,
        hint: null,
      },
    })
    expect(toAdjacentCategoriesResult({}, null).ok).toBe(false)
    expect(toAdjacentCategoriesResult({ adjacent: null }, null).ok).toBe(false)
  })

  it('preserves order on ok: true', () => {
    const result = toAdjacentCategoriesResult(
      {
        adjacent: [
          { l2_id: 2, l2_name: 'B' },
          { l2_id: 1, l2_name: 'A' },
        ],
      },
      null
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.rows.map((r) => r.l2_id)).toEqual([2, 1])
  })

  it('flags schema drift when a non-empty array parses to zero rows (still ok: true)', () => {
    const result = toAdjacentCategoriesResult(
      {
        adjacent: [{ l2_name: 'No id' }, { l2_id: 0, l2_name: 'Bad' }],
      },
      null
    )
    expect(result).toEqual({
      ok: true,
      rows: [],
      allRowsUnparsed: 2,
    })
  })

  it('does not flag drift when some rows parse', () => {
    const result = toAdjacentCategoriesResult(
      {
        adjacent: [{ l2_id: 1, l2_name: 'A' }, { l2_name: 'No id' }],
      },
      null
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rows).toHaveLength(1)
      expect(result.allRowsUnparsed).toBeUndefined()
    }
  })
})
